import { MinHeap } from "../../src/create-state/min-heap";

type RankedValue = {
  name: string;
  rank: number;
};

describe("MinHeap", () => {
  test("pops values in ascending rank as new values are added", () => {
    const heap = new MinHeap<RankedValue>((value1, value2) => value1.rank - value2.rank);

    heap.push({ name: "combined", rank: 4 });
    heap.push({ name: "long branch #1", rank: 1 });

    expect(heap.pop()?.name).toBe("long branch #1");

    heap.push({ name: "long branch #2", rank: 2 });
    heap.push({ name: "long branch #3", rank: 3 });

    expect(heap.pop()?.name).toBe("long branch #2");
    expect(heap.pop()?.name).toBe("long branch #3");
    expect(heap.pop()?.name).toBe("combined");
    expect(heap.size).toBe(0);
    expect(heap.pop()).toBeUndefined();
  });

  test("preserves insertion order for values with the same rank", () => {
    const heap = new MinHeap<RankedValue>((value1, value2) => value1.rank - value2.rank);

    heap.push({ name: "first rank 2", rank: 2 });
    heap.push({ name: "rank 1", rank: 1 });
    heap.push({ name: "second rank 2", rank: 2 });
    heap.push({ name: "third rank 2", rank: 2 });

    expect([heap.pop()?.name, heap.pop()?.name, heap.pop()?.name, heap.pop()?.name]).toEqual([
      "rank 1",
      "first rank 2",
      "second rank 2",
      "third rank 2",
    ]);
  });
});
