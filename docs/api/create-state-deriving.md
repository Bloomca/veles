---
layout: default
title: Deriving state
nav_order: 3
parent: createState
grand_parent: API
---

## Deriving state

To simplify deriving state based on other states, there are multiple methods available. If a derived state is created while a component is rendering, it is automatically disposed on unmount.

Each function with `options?` accepts an object with custom equality function like `{ equality: (value1, value2) => isEqual(value1, value2) }`.

## `state.map`

- `state.map(selector, options?)`

Transforms one state into another.

```jsx
const userState = createState({ name: "Seva", age: 30 });
const nameState = userState.map((user) => user.name);
```

## `state.filter`

- `state.filter(predicate, options?)`

Keeps only values that pass a predicate. If a new value does not pass, the previous passing value is retained.

```jsx
const numberState = createState(1);
const evenNumberState = numberState.filter((value) => value % 2 === 0);
```

You can also access the previous source value.

```jsx
const filteredState = state.filter((value, prevValue) => {
  return value !== prevValue;
});
```

## `state.scan`

- `state.scan(reducer, initialValue, options?)`

Accumulates values over time, similar to `reduce`, but as a reactive state.

```jsx
const numberState = createState(1);
const totalState = numberState.scan((acc, value) => acc + value, 0);
```

## `state.combine`

- `state.combine(state2, state3, ...)`

Combines several states into a single tuple state.

```jsx
const nameState = createState("Seva");
const lastNameState = createState("Zaikov");
const fullNameState = nameState
  .combine(lastNameState)
  .map(([name, lastName]) => `${name} ${lastName}`);
```
