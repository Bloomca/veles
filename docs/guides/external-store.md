---
layout: default
title: Using Veles with external stores
nav_order: 3
parent: Guides
---

## Using external store sources

You'll probably use some external state manager for your application, but you'll need to connect it first to convert necessary data to Veles' `state` which allows you to have reactivity. Right now there are no official bindings, but here is an example of a simple helper function to connect it to [Zustand](https://github.com/pmndrs/zustand):

```tsx
const NO_VALUE = "NO_VALUE";
export function createStoreState<T>(selector: (state: ZustandStoreState) => T) {
  let prevValue: T | string = NO_VALUE;
  const initialValue = selector(store.getState());
  return createState(initialValue, (setStoreValue) => {
    const unsubscribe = store.subscribe((newState) => {
      const newValue = selector(newState);

      if (newValue !== prevValue) {
        prevValue = newValue;
        setStoreValue(newValue);
      }
    });

    return unsubscribe;
  });
}
```

It has a simple comparator option to avoid unnecessary updates, but you expand it with a comparator to allow to refine it even further. Other state manager, like [Redux](https://redux.js.org/) should have a very similar implementation, they typically expose `subscribe` function and in the callback you'll need to update your state value.
