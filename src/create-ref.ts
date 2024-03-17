function createRef<T>(initialRefValue: T | null = null) {
  return {
    velesRef: true,
    current: initialRefValue,
  };
}

export { createRef };
