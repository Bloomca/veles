// explicit symbol for empty value, so it is 100% unique
const emptyValue = Symbol("veles-state-core-empty");

type CoreValue<T> = T | typeof emptyValue;

type Subscriber<T> = (value: T, prevValue: CoreValue<T>) => void;

type EqualityFn<T> = (
  currentValue: CoreValue<T>,
  newValue: CoreValue<T>,
) => boolean;

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

class StateCore<T> {
  private _value: CoreValue<T>;
  private _prevValue: CoreValue<T> = emptyValue;
  private _subscribers: Subscriber<T>[] = [];
  private _equality: EqualityFn<T>;

  private _dirty = false;
  private _children: Set<StateCore<any>> = new Set();
  private _parents: Set<StateCore<any>>;
  private _compute?: () => CoreValue<T>;

  constructor(initialValue: CoreValue<T>, options: CoreOptions<T> = {}) {
    this._value = initialValue;
    this._parents = new Set(options.parents);
    this._compute = options.compute;
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
      this._subscribers = this._subscribers.filter(
        (currentCb) => currentCb !== cb,
      );
    };
  }

  set(newValue: T) {
    if (this._equality(this._value, newValue)) return;

    const prevValue = this._value;
    this._prevValue = prevValue;
    this._value = newValue;
    this.notifySubscribers(newValue, prevValue);

    this._children.forEach((child) => {
      child._dirty = true;
    });

    this.flush();
  }

  update(fn: (currentValue: CoreValue<T>) => T) {
    const newValue = fn(this._value);
    this.set(newValue);
  }

  map<V>(
    fn: (value: T) => V,
    options: { equality?: EqualityFn<V> } = {},
  ): StateCore<V> {
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
      compute: (): V =>
        fn(result._value as V, this.get() as T, this._prevValue),
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
        const values = [this.get()].concat(
          sources.map((source) => source.get()),
        );

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

  private flush() {
    const queue = Array.from(this._children);
    const queued = new Set(queue);

    while (queue.length > 0) {
      const child = queue.shift()!;
      queued.delete(child);

      if (!child._dirty) continue;

      if (child.hasDirtyParents()) {
        queue.push(child);
        queued.add(child);
        continue;
      }

      const { changed } = child.recompute();
      const value = child._value;

      if (!changed) continue;

      child.notifySubscribers(value, child._prevValue);
      child._children.forEach((grandchild) => {
        grandchild._dirty = true;
        if (!queued.has(grandchild)) {
          queue.push(grandchild);
          queued.add(grandchild);
        }
      });
    }
  }

  private hasDirtyParents() {
    let hasDirtyParent = false;

    this._parents.forEach((parent) => {
      if (parent._dirty) {
        hasDirtyParent = true;
      }
    });

    return hasDirtyParent;
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
