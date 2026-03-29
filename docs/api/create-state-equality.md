---
layout: default
title: Equality and update control
nav_order: 4
parent: createState
grand_parent: API
---

## Equality and update control

By default, Veles uses referential equality (`===`) to decide whether something changed.

That applies to:

- `set`
- `update`
- derived state updates
- selector-based subscriptions
- selector-based rendering

## Custom equality in derived state

Derived methods accept an `equality` option.

### `state.map`

```jsx
const parity$ = number$.map(
  (value) => ({ parity: value % 2 }),
  {
    equality: (a, b) => a.parity === b.parity,
  },
);
```

### `state.filter`

```jsx
const activeTask$ = task$.filter(
  (task) => task.active,
  {
    equality: (a, b) => a.id === b.id,
  },
);
```

### `state.scan`

```jsx
const summary$ = number$.scan(
  (acc, value) => ({ parity: (acc.parity + value) % 2 }),
  { parity: 0 },
  {
    equality: (a, b) => a.parity === b.parity,
  },
);
```

## Comparator in subscriptions

`track` and `trackSelected` accept `comparator` options.

```jsx
state.trackSelected(
  (value) => value.user,
  (user) => {
    console.log(user);
  },
  {
    comparator: (a, b) => a.id === b.id,
  },
);
```

## Comparator in rendering

`render` and `renderSelected` also accept comparators.

```jsx
state.renderSelected(
  (value) => value.user,
  (user) => <UserCard user={user} />,
  (a, b) => a.id === b.id,
);
```

## When to use custom equality

Custom equality is useful when:
- you create new objects often
- only some fields matter for rendering
- you want to avoid unnecessary derived updates
- you want to avoid unnecessary DOM replacements

If simple referential equality is enough, prefer the default behavior.

## Disabling equality

To disable equality completely, simply pass `() => false` function for equality checks, and it will always call all the subscribers.
