import { MinHeap } from "./min-heap";

// explicit symbol for empty value, so it is 100% unique
const emptyValue = Symbol("veles-state-core-empty");

type CoreValue<T> = T | typeof emptyValue;

type Subscriber<T> = (value: T, prevValue: CoreValue<T>) => void;

type EqualityFn<T> = (currentValue: CoreValue<T>, newValue: CoreValue<T>) => boolean;

type CoreOptions<T> = {
  // internal value, don't set it directly
  parents?: StateCore<any>[];
  // internal value, don't set it directly
  compute?: () => CoreValue<T>;
  // internal value, don't set it directly
  dirty?: boolean;
  // custom equality function, by default it uses `===`. Provide `() => false` to have no comparator
  equality?: EqualityFn<T>;
};

const defaultEquality: EqualityFn<any> = (value1, value2) => value1 === value2;

type PendingNotification = { node: StateCore<any>; value: any; prevValue: any };

class StateCore<T> {
  private _value: CoreValue<T>;
  private _prevValue: CoreValue<T> = emptyValue;
  private _subscribers: Subscriber<T>[] = [];
  private _equality: EqualityFn<T>;

  private _dirty = false;
  private _children: Set<StateCore<any>> = new Set();
  private _parents: Set<StateCore<any>>;
  private _compute?: () => CoreValue<T>;
  private _rank: number;

  constructor(initialValue: CoreValue<T>, options: CoreOptions<T> = {}) {
    this._value = initialValue;
    const parents = options.parents || [];
    this._parents = new Set(parents);
    this._compute = options.compute;
    this._rank = parents.reduce((rank, parent) => Math.max(rank, parent._rank + 1), 0);
    this._dirty = Boolean(options.dirty);
    this._equality = options.equality || defaultEquality;
  }

  get() {
    this.recompute();
    return this._value;
  }

  getPrevious() {
    return this._prevValue;
  }

  on(cb: Subscriber<T>): () => void {
    this._subscribers.push(cb);

    return () => {
      this._subscribers = this._subscribers.filter((currentCb) => currentCb !== cb);
    };
  }

  set(newValue: T) {
    if (this._equality(this._value, newValue)) return;

    const prevValue = this._value;
    this._prevValue = prevValue;
    this._value = newValue;

    this._children.forEach((child) => {
      child._dirty = true;
    });

    const pendingNotifications = this.flush();

    // technically, we can notify subscribers earlier, but then synchronous reading
    // would return stale state values.
    this.notifySubscribers(newValue, prevValue);

    // we intentionally process derived notifications after direct subscribers to
    // the signal
    pendingNotifications.forEach(({ node, value, prevValue }) => {
      node.notifySubscribers(value, prevValue);
    });
  }

  update(fn: (currentValue: CoreValue<T>) => T) {
    const newValue = fn(this._value);
    this.set(newValue);
  }

  map<V>(fn: (value: T) => V, options: { equality?: EqualityFn<V> } = {}): StateCore<V> {
    const result = new StateCore<V>(emptyValue, {
      parents: [this],
      compute: () => fn(this.get() as T),
      dirty: true,
      equality: options.equality,
    });

    this._children.add(result);

    return result;
  }

  filter(
    fn: (value: T, prevValue?: CoreValue<T>) => boolean,
    options: { equality?: EqualityFn<T> } = {},
  ): StateCore<T> {
    let result!: StateCore<T>;
    result = new StateCore<T>(emptyValue, {
      parents: [this],
      compute: (): CoreValue<T> => {
        const value = this.get();
        return fn(value as T, this._prevValue) ? value : result._value;
      },
      dirty: true,
      equality: options.equality,
    });

    this._children.add(result);

    return result;
  }

  scan<V>(
    fn: (acc: V, value: T, prevValue?: CoreValue<T>) => V,
    initialValue: V,
    options: { equality?: EqualityFn<V> } = {},
  ): StateCore<V> {
    let result!: StateCore<V>;
    result = new StateCore<V>(initialValue, {
      parents: [this],
      compute: (): V => fn(result._value as V, this.get() as T, this._prevValue),
      dirty: true,
      equality: options.equality,
    });

    this._children.add(result);

    return result;
  }

  combine<Sources extends StateCore<any>[]>(
    ...sources: [...Sources]
  ): StateCore<
    [
      T,
      ...{
        [K in keyof Sources]: Sources[K] extends StateCore<infer U> ? U : never;
      },
    ]
  > {
    const result = new StateCore(emptyValue, {
      parents: [this, ...sources],
      compute: () => {
        const values = [this.get()].concat(sources.map((source) => source.get()));

        if (values.some((value) => value === emptyValue)) {
          return emptyValue;
        }

        return values;
      },
      dirty: true,
      equality: (value1, value2) => {
        if (value1 === value2) return true;
        if (value1 === emptyValue) return false;
        if (value2 === emptyValue) return false;

        return value1.every((arrayValue1, index) => {
          const arrayValue2 = value2[index];
          return arrayValue1 === arrayValue2;
        });
      },
    }) as any;

    this._children.add(result);
    sources.forEach((source) => {
      source._children.add(result);
    });

    return result;
  }

  dispose() {
    this._subscribers = [];

    this._parents.forEach((parent) => {
      parent._children.delete(this);
    });

    this._children.forEach((child) => {
      child._parents.delete(this);
    });

    this._children.clear();
    this._parents.clear();
  }

  private recompute() {
    if (!this._compute || !this._dirty) {
      return { changed: false };
    }

    const newValue = this._compute();
    const changed = !this._equality(this._value, newValue);
    if (changed) {
      this._prevValue = this._value;
      this._value = newValue;
    }
    this._dirty = false;

    return { changed };
  }

  private flush(): PendingNotification[] {
    const pendingNotifications: PendingNotification[] = [];

    /**
     * We utilize a min-heap to ensure that we don't trigger notifications
     * before all the previous necessary work is done. Otherwise it can
     * happen too early, and we'd need to recursively check that every parent
     * is not dirty and schedule it again.
     *
     * Here we achieve this by assinging a rank to each core state, which is
     * determined by the highest rank of any of the parent + 1.
     *
     * After that, we process them at the same rank, ensuring that "short" branches
     * are not executed before all their parents are done with their recomputation.
     */
    const queue = new MinHeap<StateCore<any>>((node1, node2) => node1._rank - node2._rank);
    const queued = new Set<StateCore<any>>();
    const enqueue = (node: StateCore<any>) => {
      if (queued.has(node)) return;

      queue.push(node);
      queued.add(node);
    };

    this._children.forEach(enqueue);

    while (queue.size > 0) {
      const child = queue.pop()!;
      queued.delete(child);

      if (!child._dirty) continue;

      // A dirty parent might not have been scheduled by this flush, for example
      // when a lazily computed state is combined with the state being updated.
      // Its lower rank ensures it will run before this child after both are queued.
      let shouldRescheduleChild = false;
      child._parents.forEach((parentNode) => {
        if (parentNode._dirty) {
          enqueue(parentNode);
          shouldRescheduleChild = true;
        }
      });

      if (shouldRescheduleChild) {
        enqueue(child);
        continue;
      }

      const { changed } = child.recompute();
      const value = child._value;

      if (!changed) continue;

      pendingNotifications.push({
        node: child,
        prevValue: child._prevValue,
        value,
      });
      child._children.forEach((grandchild) => {
        grandchild._dirty = true;
        enqueue(grandchild);
      });
    }

    return pendingNotifications;
  }

  private notifySubscribers(value: CoreValue<T>, prevValue: CoreValue<T>) {
    if (value === emptyValue) {
      return;
    }

    this._subscribers.forEach((cb) => cb(value as T, prevValue));
  }
}

function createCoreEquality<T>(
  comparator?: (value1: T, value2: T) => boolean,
): EqualityFn<T> | undefined {
  if (!comparator) {
    return undefined;
  }

  return (value1, value2) => {
    if (value1 === emptyValue && value2 === emptyValue) {
      return true;
    }

    if (value1 === emptyValue || value2 === emptyValue) {
      return false;
    }

    return comparator(value1 as T, value2 as T);
  };
}

export { StateCore, emptyValue, createCoreEquality };
export type { EqualityFn };
