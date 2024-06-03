# Veles

![Tests status](https://github.com/bloomca/veles/actions/workflows/pull-request-workflow.yaml/badge.svg)
[![Build Size](https://img.shields.io/bundlephobia/minzip/veles?label=bundle%20size)](https://bundlephobia.com/result?p=veles)
[![Version](https://img.shields.io/npm/v/veles)](https://www.npmjs.com/package/veles)

> The library is in very early stages and some features, like proper TypeScript support, are not fully implemented yet

`Veles` is a component-based performance-focused UI library. The main goal of this library is to provide a composable way to build highly interactive interfaces, which should be performant out of the box, as long as you follow the recommendations.

## Performance

This library's primary focus is in performance. What this means is that it allows you to write your code in a way which will ensure that when the data in your app changes, only the smallest relevant parts will update. Despite of similarities with React in syntax, it does not follow the same waterfall style for component re-renders. Instead, it gives you API to subscribe to atomic changes in your tracked state and re-render only parts of the UI which actually depend on the value. Internally, it renders new HTML and replaces the old node. A similar approach is done for attributes, where in case of changes, only the relevant attribute will be updated in place, but nothing else will change.

It is important to note that the performance benefits will only be observed (and relevant as well) in case of a pretty high interactivity. It might not be faster than any other UI framework on the first render, the biggest improvement lies in the power of subscribing to individual changes.

## API

### AttachComponent

Attach Veles tree to a regular DOM Node.

> [!NOTE]
> As of right now, this method will wrap the component's HTML into one additional `div`. This will probably go away in the future, but for now it simplifies some things significantly.

```js
import { attachComponent } from "veles";

const App () => <div>App</div>

const appContainer = document.getElementById("app");
attachComponent({ htmlElement: appContainer, component: <App /> });
```

### JSX support

Veles supports JSX transformation, so as long as you specify `importSource: "veles"` (this is for Babel, the other JS transpilers should have similar options) it will work as expected.

```jsx
function App() {
  return (
    <div class="app-container">
      <h1>Veles App</h1>
      <p>Random description</p>
    </div>
  );
}
```

### createState

`createState` is the API which is responsible for the interactivity in Veles applications, and it is the only one. You can either pass the initial value and then update it manually in callbacks or some other subscriptions, or you can pass a function as the second argument and you can subscribe to any external data store and update the state reacting to it.

`createState` returns an object with a variety of subscription methods. It is important to understand that just creating the state object does not affect the component at all. When the state value updates, only the components which are rendered by these subscription methods will update, but the component where the state was created is not affected.

The simplest way to react to state changes in the UI is to use `useValue` method from the state object. Let's build a simple counter to demonstrate:

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState(0);
  const increment = () =>
    counterState.setValue((currentValue) => currentValue + 1);
  const decrement = () =>
    counterState.setValue((currentValue) => currentValue - 1);
  return (
    <div>
      <h1>Counter</h1>
      <div>
        {counterState.useValue(
          (counterValue) => `counter value is: ${counterValue}`
        )}
      </div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### createState and partial subscriptions

If you have an object in your store, even atomic updates will be wasteful. Let's say you have an object with several fields, but you are only interested in the `title` property. If you use `useValue`, it will do unnecessary work. To help with that, there is a `useValueSelector` state method, which accepts a selector function as the first parameter. Here is an example:

```jsx
import { createState } from "veles";

function App() {
  const taskState = createState({
    id: 5,
    title: "title",
    description: "long description",
  });
  return (
    <div>
      <h1>App</h1>
      <div>
        {taskState.useSelectorValue(
          (task) => task.title,
          (title) => `task title: ${title}`
        )}
      </div>
    </div>
  );
}
```

The component which listens for `title` will only be rendered again when the title changes.

### createState and lists

Lists performance is one of the cornerstones of this library, and to help with that, it provides a special state method `useValueIterator`. This method ensures that when the state changes, instead of re-rendering the whole list, it checks each list element individually, moves them into correct order without unnecessary re-renders, and in case of changes element data, it will update the passed state object, so that only subscribed parts will re-render.

> [!NOTE]
> the library determines the uniqueness by calculating the key. You can either pass a string which will be a property name, or you can pass a function which will be executed with the element and the index. If the result is different from any previous calculations, it treats it as a new component.

Let's build a simple list component:

```jsx
import { createState } from "veles";

function List() {
  const listState = createState([
    { id: 1, name: "first task" },
    { id: 2, name: "second task" },
    { id: 3, name: "third task" },
  ]);

  return <div>
    <h1>List</h1>
    {listState.useValueIterator<{ id: number; name: string }>(
        { key: "id" },
        ({ elementState }) => <div>
          {elementState.useValueSelector(
            (element) => element.name,
            (name) => <div>{name}</div>
          )}
        </div>
      )}
  </div>
}
```

### createState and attributes

In order to avoid unnecessary re-renders when you to change properties on a wrapper element/component, there is a special state method `useAttribute`. It allows to recalculate value for an attribute every time the state changes, but instead of re-rendering, it calls the `htmlNode.setAttribute` method. Here is an example:

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState(0);
  const increment = () =>
    counterState.setValue((currentValue) => currentValue + 1);
  return (
    <div>
      <h1>Counter</h1>
      <div>{counterState.useValue((value) => `counter value is ${value}`)}</div>
      <button
        onClick={increment}
        style={counterState.useAttribute(
          (currentValue) => `width: ${50 + currentValue}px;`
        )}
      >
        +
      </button>
    </div>
  );
}
```

You can see that we dynamically change the width of the button with every press. This will be the only change, the rest of the application will not be re-rendered or any code will not be executed. You still need to be mindful what are you changing, as with some CSS changes you can force reflows/repaints and that can still cause some performance issues.

### createState and subscribing to updates

What if you don't want to render anything when the value changes, but you want to call your code? The state provides `trackValue` method, which does exactly that. Here is an example:

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState(0);

  counterState.trackValue((counterValue) => {
    console.log(`new counter value is ${counterValue}`);
  });
  const increment = () =>
    counterState.setValue((currentValue) => currentValue + 1);
  const decrement = () =>
    counterState.setValue((currentValue) => currentValue - 1);

  return (
    <div>
      <h1>Counter</h1>
      <div>
        {counterState.useValue(
          (counterValue) => `counter value is: ${counterValue}`
        )}
      </div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

This subscription will not cause any re-renders. By default, the first call will happen during the component initialization, and you can pass a second options object to alter this behaviour. You can either set `{ skipFirstCall: true }` to completely skip it, or you can specify to run it when the component is mounted in DOM: `{ callOnMount: true }`.

### Subscribing to partial updates

In case you don't want to subscribe to the whole state, you have 2 options. You can either provide a `{ comparator: (prevValue, nextValue) => prevValue === nextValue }` property in the options object, or you can use `state.trackValueSelector()` method. You can also combine them, if you need that for some reason.

### Combining different states

Since `createState` is the only way to add dynamic behaviour to the application, sooner or later you'll need to build UI which depends on several states. To do so, you can use `combineState` function which accepts any amount of state objects, and returns an array with all combined values in it.

```jsx
import { createState } from "veles";

function Counter() {
  const firstcounterState = createState(0);
  const secondCounterState = createState(0);
  const combinedCounterState = combineState(
    firstcounterState,
    secondCounterState
  );
  const incrementFirstCounter = () =>
    firstcounterState.setValue(
      (currentCounterValue) => currentCounterValue + 1
    );
  const incrementSecondCounter = () =>
    secondCounterState.setValue(
      (currentCounterValue) => currentCounterValue + 1
    );
  return (
    <div>
      <h1>Counters</h1>
      <div>
        {firstcounterState.useValue(
          (value) => `first counter value is: ${value}`
        )}
      </div>
      <div>
        {secondCounterState.useValue(
          (value) => `second counter value is: ${value}`
        )}
      </div>
      <div>
        {combinedCounterState.useValueSelector(
          ([firstValue, secondValue]) => firstValue + secondValue,
          (counterValue) => `combined counter value is: ${counterValue}`
        )}
      </div>
      <button onClick={incrementFirstCounter}>Increment first counter</button>
      <button onClick={incrementSecondCounter}>Increment second counter</button>
    </div>
  );
}
```

### Components lifecycle

Right now there are `onMount` and `onUnmount` lifecycle hooks. In your component, just import and call them to add a callback.

> [!NOTE]
> You can only use them during the original initialization of the component. If you want to add some callbacks later, use the same version passed as a second argument to your component

```jsx
import { onMount, onUnmount } from "veles";

function App(_props, componentAPI) {
  // could be used as `componentAPI.onMount()`
  onMount(() => {
    console.log("called when the component mounts");
  });
  // could be used as `componentAPI.onUnmount()`
  onUnmount(() => {
    console.log("called when the component unmounts");
  });
  return <div>Application<div>
}
```
