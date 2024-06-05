---
layout: default
title: Working with multiple states
nav_order: 1
parent: Guides
---

## `createState` primitive

The only way to get reactivity in the Veles' application is to subscribe to `createState` primitives. You can pass the states around, and child components will be able to subscribe only to specific parts they are interested in; while it is great for performance, it means that sooner or later you'll have some parts of the application which depend on several states.

Right now the library provides only one function (`combineStates`) to help with that, but it will be expanded in the future. While I was working on an application, I came up with this helper:

```ts
function selectState<F, T>(
  state: State<F>,
  selector: (state: F) => T
): State<T> {
  const initialValue = selector(state.getValue());

  const newState = createState(initialValue);
  state.trackValueSelector(
    selector,
    (selectedState) => {
      newState.setValue(selectedState);
    },
    { skipFirstCall: true }
  );

  return newState;
}
```

This function basically allows you to create substates, so you can map data into something else; you can combine several states together, which makes them into `State<[state1, state2, state3]>` shape, and then process into a more expressive form.
