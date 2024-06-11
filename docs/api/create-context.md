---
layout: default
title: Context API
nav_order: 6
parent: API
---

## Context API

Veles allows you to create Context, add it to your components and use it in children without passing anything directly; it also helps to encapsulate application-specific data. Keep in mind that Context is completely immutable and won't trigger any re-renders on its own. The only way to get reactivity from the Context is to store a state there, and to subscribe to that state in individual components.

Here is a full example on how to use Context:

```jsx
import { createContext } from "veles";

const exampleContext = createContext();

function App() {
  exampleContext.addContext(5);
  return (
    <div>
      <h1>Application</h1>
      <NestedComponent />
    </div>
  );
}

function NestedComponent() {
  const value = exampleContext.readContext();

  // the value will be 5
  return <div>{`Context value is ${value}`}</div>;
}
```

> As of right now, there is no `defaultValue` for the Context

As you can see, we created a new Context, then added it inside the `<App>` component, and then read it in the child component.

## Reference

- `createContext()`

Receives no parameters, returns a Context object with the following structure:

- `context.addContext(value)`

Has to be executed inside a component initialization (it won't work properly if you execute it in a lifecycle hook or in some event handler). Adds a value to the Context which will be available to all children, including the ones executed conditionally.

- `context.readContext()`

Read currently saved Context value. If there were several Contexts added of the same object, the latest one will be used.

- `context.Provider`

This is a component which adds Context to all the children. It works almost identical to `context.addContext()` with a major caveat: children cannot be conditional. Because of that, I recommend to go with the `context.addContext()` approach, but you can use this one as well. Here is an example of how to use it:

```jsx
import { createContext } from "veles";

const exampleContext = createContext();

function App() {
  return (
    <exampleContext.Provider value={5}>
      <div>
        <h1>Application</h1>
        <NestedComponent />
      </div>
    </exampleContext.Provider>
  );
}

function NestedComponent() {
  const value = exampleContext.readContext();

  // the value will be 5
  return <div>{`Context value is ${value}`}</div>;
}
```

Since the children are not conditional, it will work as expected. Here is an example when it won't work as you expect:

```jsx
import { createContext, createState } from "veles";

const exampleContext = createContext();

function App() {
  const showState = createState(false);
  return (
    <exampleContext.Provider value={5}>
      <div>
        <h1>Application</h1>
        <NestedComponent />
        <button
          onClick={() => showState.setValue((currentValue) => !currentValue)}
        >
          Toggle conditional component
        </button>
        {showState.useValue((shouldShow) =>
          shouldShow ? <ConditionalComponent /> : null
        )}
      </div>
    </exampleContext.Provider>
  );
}

function NestedComponent() {
  const value = exampleContext.readContext();

  // the value will be 5
  return <div>{`Context value is ${value}`}</div>;
}

function ConditionalComponent() {
  const value = exampleContext.readContext();

  // the value will be undefined
  return <div>{`Context value in conditional component is ${value}`}</div>;
}
```

The component which is rendered at all times (`<NestedComponent />`) will have the correct Context value, but the conditional one will not. Once you are inside a component, you can use state functions as usual, it is only about the direct children of `context.Provider`.
