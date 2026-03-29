---
layout: default
title: Component bindings
nav_order: 2
parent: createState
---

## Component bindings

While the state allows to interact with it imperatively, inside components you probably want to utilize built-in methods to automatically track value changes.

## `state.track`

- `state.track(cb)`
- `state.track(cb, options?: { callOnMount, skipFirstCall, comparator })`

Subscribes to all state updates, automatically unsubscribe when the component where it is called unmounts.

By default:
- the callback runs immediately with the current value
- future calls run when the value changes by referential equality (`===`)

You can use:
- `callOnMount: true` to defer the first call until the component is mounted
- `skipFirstCall: true` to skip the initial call
- `comparator` to control when updates should be considered equal

```jsx
state.track((value) => {
  console.log("new value", value);
});
```

## `state.trackSelected`

- `state.trackSelected(selector, cb)`
- `state.trackSelected(selector, cb, options?: { callOnMount, skipFirstCall, comparator })`

Subscribes to a selected part of the state and only triggers when that selected value changes.

```jsx
userState.trackSelected(
  (user) => user.name,
  (name) => {
    console.log("new name", name);
  },
);
```

## `state.render`

- `state.render()`
- `state.render(value => Veles.Node, comparator?)`

`render` renders markup based on the current state value and updates it whenever the value changes.

```jsx
const titleState = createState("hello");

return titleState.render((title) => <p>{title}</p>);
```

If called without a callback, it renders the value directly.

```jsx
const titleState = createState("hello");
return titleState.render();
```

## `state.renderSelected`

- `state.renderSelected(selector)`
- `state.renderSelected(selector, selectedValue => Veles.Node, comparator?)`

Works like `render`, but first selects a smaller piece of the state. This will make updates more atomic.

```jsx
const taskState = createState({ title: "task", completed: false });

return taskState.renderSelected((task) => task.title, (title) => <p>{title}</p>);
```

This can be used for conditionals.

```jsx
titleState.renderSelected(
  (title) => title.length > 100,
  (isTooLong) => (isTooLong ? <Warning /> : null),
);
```

## `state.attribute`

- `state.attribute()`
- `state.attribute(value => attributeValue)`

`attribute` is used for reactive DOM attributes. When the value changes, only that specific DOM Node's attribute will be changed.

```jsx
const disabledState = createState(false);

return <button disabled={disabledState.attribute()} />;
```

You can also transform the value first.

```jsx
const widthState = createState(100);

return <div style={widthState.attribute((value) => `width: ${value}px`)} />;
```

## `state.renderEach`

- `state.renderEach({ key: "id" }, ({ elementState }) => ...)`
- `state.renderEach({ key, selector }, ({ elementState, indexState }) => ...)`

`renderEach` is the optimized way to render arrays. It works by comparing old and new states and only making necessary DOM changes, e.g. inserting a new component into a specific position, or simply swapping 2 nodes without re-rendering anything. It wraps each individual value into the state object, which allows to avoid any unnecessary re-renders.

```jsx
const tasksState = createState([
  { id: "1", title: "first" },
  { id: "2", title: "second" },
]);

return tasksState.renderEach({ key: "id" }, ({ elementState }) => {
  return <div>{elementState.renderSelected((task) => task.title)}</div>;
});
```

The callback receives:
- `elementState`: state for the current item
- `indexState`: state for the current item index
