import { describe, expect, test, vi } from "vitest";

import { StateCore, emptyValue } from "../../src/create-state/state-core";

describe("state modifications", () => {
  describe("map(fn)", () => {
    test("derives a new core by applying fn to the current value", () => {
      const x = new StateCore(2);
      const doubled = x.map((value) => value * 2);

      expect(doubled.get()).toBe(4);
    });

    test("updates when the source updates", () => {
      const x = new StateCore(1);
      const y = x.map((value) => value + 10);

      x.set(5);

      expect(y.get()).toBe(15);
    });

    test("supports a custom equality function", () => {
      const x = new StateCore(1);
      const y = x.map((value) => ({ parity: value % 2 }), {
        equality: (current, next) =>
          current !== emptyValue &&
          next !== emptyValue &&
          current.parity === next.parity,
      });
      const firstValue = y.get();
      const spy = vi.fn();

      y.on(spy);
      x.set(3);

      expect(y.get()).toBe(firstValue);
      expect(spy).not.toHaveBeenCalled();
    });

    test("passes the previous derived value to subscribers", () => {
      const x = new StateCore(1);
      const y = x.map((value) => value * 2);
      const spy = vi.fn();

      y.on(spy);
      x.set(2);
      x.set(3);

      expect(spy).toHaveBeenNthCalledWith(1, 4, emptyValue);
      expect(spy).toHaveBeenNthCalledWith(2, 6, 4);
    });
  });

  describe("filter(fn)", () => {
    test("starts empty until the predicate passes", () => {
      const x = new StateCore(1);
      const y = x.filter((value) => value % 2 === 0);

      expect(y.get()).toBe(emptyValue);
      x.set(2);
      expect(y.get()).toBe(2);
    });

    test("retains the last passing value when the predicate fails", () => {
      const x = new StateCore(2);
      const y = x.filter((value) => value % 2 === 0);

      expect(y.get()).toBe(2);
      x.set(3);
      expect(y.get()).toBe(2);
      x.set(4);
      expect(y.get()).toBe(4);
    });

    test("passes the source previous value into the predicate", () => {
      const x = new StateCore(1);
      const predicate = vi.fn((value: number) => value % 2 === 0);
      const y = x.filter(predicate);

      expect(y.get()).toBe(emptyValue);
      x.set(2);

      expect(predicate).toHaveBeenNthCalledWith(1, 1, emptyValue);
      expect(predicate).toHaveBeenNthCalledWith(2, 2, 1);
    });
  });

  describe("scan(fn, initialValue)", () => {
    test("derives an accumulated core from the current value", () => {
      const x = new StateCore(2);
      const total = x.scan((acc, value) => acc + value, 10);

      expect(total.get()).toBe(12);
    });

    test("updates the accumulated value when the source updates", () => {
      const x = new StateCore(1);
      const total = x.scan((acc, value) => acc + value, 0);

      expect(total.get()).toBe(1);
      x.set(2);
      expect(total.get()).toBe(3);
      x.set(3);
      expect(total.get()).toBe(6);
    });

    test("passes the source previous value into the reducer", () => {
      const x = new StateCore(1);
      const reducer = vi.fn((acc: number, value: number) => acc + value);
      const total = x.scan(reducer, 0);

      expect(total.get()).toBe(1);
      x.set(2);

      expect(reducer).toHaveBeenNthCalledWith(1, 0, 1, emptyValue);
      expect(reducer).toHaveBeenNthCalledWith(2, 1, 2, 1);
    });
  });

  describe("combine(...cores)", () => {
    test("emits a tuple of current values when all sources are non-empty", () => {
      const a = new StateCore(1);
      const b = new StateCore(2);
      const c = a.combine(b);

      expect(c.get()).toEqual([1, 2]);
    });

    test("updates the tuple when any source updates", () => {
      const a = new StateCore(1);
      const b = new StateCore(2);
      const c = a.combine(b);

      a.set(10);
      expect(c.get()).toEqual([10, 2]);
      b.set(20);
      expect(c.get()).toEqual([10, 20]);
    });

    test("passes the previous combined value to subscribers", () => {
      const a = new StateCore(1);
      const b = new StateCore(2);
      const c = a.combine(b);
      const spy = vi.fn();

      c.on(spy);
      a.set(10);
      b.set(20);

      expect(spy).toHaveBeenNthCalledWith(1, [10, 2], emptyValue);
      expect(spy).toHaveBeenNthCalledWith(2, [10, 20], [10, 2]);
    });

    test("does not notify when recomputed tuple is shallow-equal", () => {
      const x = new StateCore(1);
      const parity = x.map((value) => value % 2, {
        equality: (current, next) => current === next,
      });
      const positive = x.map((value) => value > 0, {
        equality: (current, next) => current === next,
      });
      const combined = parity.combine(positive);
      const spy = vi.fn();

      expect(combined.get()).toEqual([1, true]);
      combined.on(spy);
      x.set(3);

      expect(combined.get()).toEqual([1, true]);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("glitch-free push-pull", () => {
    test("does not emit inconsistent intermediate states in a diamond graph", () => {
      const a = new StateCore(1);
      const b = a.map((value) => value * 2);
      const c = a.map((value) => value * 3);
      const d = b.combine(c);

      const emissions: [number, number][] = [];
      d.on((value) => emissions.push(value as [number, number]));

      a.set(2);

      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toEqual([4, 6]);
    });
  });
});
