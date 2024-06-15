/**
 * Create a reference which has special treatment if passed as
 * ref={ref} to any DOM Node. `ref.current` will contain the
 * rendered node, even if it changes.
 */
function createRef<T>(initialRefValue: T | null = null): {
  velesRef: true;
  current: T | null;
} {
  return {
    velesRef: true,
    current: initialRefValue,
  };
}

export { createRef };
