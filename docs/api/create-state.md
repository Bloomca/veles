---
layout: default
title: createState
nav_order: 1
parent: API
has_children: true
---

## Veles.createState

`createState` is the main reactive primitive in Veles to store state and update UI dynamically based on the changed value. It lets you to interact with it both imperatively (for example, reading and setting values in a DOM event handler) and declaratively, e.g. by combining multiple states together and deriving a new state from it, which can be composed again.

## Reference

- `createState(initialValue, subscribeCallback?)`

## Example

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState(0);

  return (
    <div>
      <button
        onClick={() =>
          counterState.updateValue((currentValue) => currentValue + 1)
        }
      >
        +
      </button>
      <p>{counterState.render((value) => `counter value is ${value}`)}</p>
    </div>
  );
}
```

## Sections

- [Accessing and updating state](./create-state-accessing.html)
- [Component bindings](./create-state-component-bindings.html)
- [Deriving state](./create-state-deriving.html)
- [Equality and update control](./create-state-equality.html)

## Parameters

- `initialValue`: the initial state value
- **optional** `subscribeCallback`: receives `state.setValue` and can return a cleanup function. If the state is created inside a component, that cleanup function will run on unmount. Used to set up internal updates and usually not required directly.

## More on `subscribeCallback`

You can connect external sources to a state by passing a second argument to `createState`. This is mostly useful to create self-contained listeners, as they will be automatically cleaned up when the component unmounts.

```jsx
const widthState = createState(window.innerWidth, (setValue) => {
  const listener = () => setValue(window.innerWidth);
  window.addEventListener("resize", listener);

  return () => {
    window.removeEventListener("resize", listener);
  };
});
```

## `createState.empty`

`createState.empty` is a public empty marker value. It can be used to create states that do not have a real value yet.

```jsx
const resultState = createState(createState.empty);
```

## `state.dispose`

- `state.dispose()`

Disposes the current state and disconnects it from parent/child derived states. As long as you create state inside components, you never need to dispose state manually. This is helpful if you manage it fully outside of the Veles framework.

## Example

```jsx
function FullName() {
  const nameState = createState("Seva");
  const lastNameState = createState("Zaikov");
  const fullNameState = nameState
    .combine(lastNameState)
    .map(([name, lastName]) => `${name} ${lastName}`);

  return fullNameState.render((value) => <p>{value}</p>);
}
```
