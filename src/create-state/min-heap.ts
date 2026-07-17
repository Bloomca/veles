type HeapEntry<T> = {
  value: T;
  insertionOrder: number;
};

/**
 * A stable min-heap. Values with the same priority are returned in
 * insertion order.
 */
class MinHeap<T> {
  private _entries: HeapEntry<T>[] = [];
  private _insertionOrder = 0;
  private _compareValues: (value1: T, value2: T) => number;

  constructor(compareValues: (value1: T, value2: T) => number) {
    this._compareValues = compareValues;
  }

  get size() {
    return this._entries.length;
  }

  push(value: T) {
    const entry = {
      value,
      insertionOrder: this._insertionOrder++,
    };
    let index = this._entries.length;

    this._entries.push(entry);

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parentEntry = this._entries[parentIndex];

      if (this.compareEntries(parentEntry, entry) <= 0) break;

      this._entries[index] = parentEntry;
      index = parentIndex;
    }

    this._entries[index] = entry;
  }

  pop(): T | undefined {
    const firstEntry = this._entries[0];
    const lastEntry = this._entries.pop();

    if (!firstEntry || !lastEntry) return undefined;
    if (this._entries.length === 0) return firstEntry.value;

    let index = 0;
    while (true) {
      const leftChildIndex = index * 2 + 1;
      const rightChildIndex = leftChildIndex + 1;
      let smallestIndex = index;

      if (
        leftChildIndex < this._entries.length &&
        this.compareEntries(this._entries[leftChildIndex], lastEntry) < 0
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this._entries.length &&
        this.compareEntries(
          this._entries[rightChildIndex],
          smallestIndex === index ? lastEntry : this._entries[leftChildIndex],
        ) < 0
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex === index) break;

      this._entries[index] = this._entries[smallestIndex];
      index = smallestIndex;
    }

    this._entries[index] = lastEntry;

    return firstEntry.value;
  }

  private compareEntries(entry1: HeapEntry<T>, entry2: HeapEntry<T>) {
    const valueComparison = this._compareValues(entry1.value, entry2.value);

    return valueComparison === 0 ? entry1.insertionOrder - entry2.insertionOrder : valueComparison;
  }
}

export { MinHeap };
