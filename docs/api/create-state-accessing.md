---
layout: default
title: Accessing and updating state
nav_order: 1
parent: createState
grand_parent: API
---

## Accessing and updating state

When using Veles' state primitive, you can interact with it purely imperatively by reading and setting values. This is useful for multiple reasons:

- to have a simple mental modal when reading latest values in a callback (like an event handler)
- by allowing to set values imperatively, it makes integrating other sources very simple

## `state.set`

- `state.set(newValue)`

Simply sets the next value. Please note that by default the state compares the values using `===` operator, and if the value is unchanged, nothing gets triggered. More on this in the [Equality and update control](./create-state-equality.html).

```jsx
const titleState = createState("hello");
titleState.set("world");
```

## `state.update`

- `state.update((currentValue) => newValue)`

Updates the value based on the latest current value. This is useful when the next value depends on the previous one, but is also functionally equivalent on reading the latest value and immediately calling `.set(prevValue + 1)`.

```jsx
const counterState = createState(0);
counterState.update((currentValue) => currentValue + 1);
```

## `state.get`

- `state.get()`

Reads the current value synchronously.

This is usually useful in event handlers and imperative code. Avoid using it for rendering, because it does not subscribe to updates and your components will end up not reactive.

```jsx
const formState = createState({ title: "", done: false });

function submit() {
  const value = formState.get();
  saveTask(value);
}
```

## `state.getPrevious`

- `state.getPrevious()`

Returns the previous value, if there was one.

```jsx
const countState = createState(0);
countState.set(1);
countState.getPrevious(); // 0
```
