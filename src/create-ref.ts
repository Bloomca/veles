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
