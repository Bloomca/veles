# Veles

![Tests status](https://github.com/bloomca/veles/actions/workflows/pull-request-workflow.yaml/badge.svg)

> The library is in very early stages and is not published yet as some crucial APIs are still under development

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
import { createElement, attachComponent } from "veles";

const appContainer = document.getElementById("app");
attachComponent({ htmlElement: appContainer, component: createElement(App) });
```

### createElement

Create Veles tree. Accepts strings for regular valid HTML elements (like `div`, `span`, etc) and functions which are expected to return another Veles tree from `createElement`.

> [!NOTE]
> JSX should be almost fully supported as long as you specify `Veles.createElement` pragma (no `Fragment` support at the moment)

```js
import { createElement } from "veles";

function App() {
  return createElement("div", {
    class: "app-container",
    children: [
      createElement("h1", { children: "Veles app" }),
      createElement("p", { children: "Random description" }),
    ],
  });
}
```

### createState

`createState` is the API which is responsible for the interactivity in Veles applications, and it is the only one. You can either pass the initial value and then update it manually in callbacks or some other subscriptions, or you can pass a function as the second argument and you can subscribe to any external data store and update the state reacting to it.

`createState` returns an object with a variety of subscription methods. It is important to understand that just creating the state object does not affect the component at all. When the state value updates, only the components which are rendered by these subscription methods will update, but the component where the state was created is not affected.

The simplest way to react to state changes in the UI is to use `useValue` method from the state object. Let's build a simple counter to demonstrate:

```js
import { createElement, createState } from "veles";

function Counter() {
  const counterState = createState(0);
  return createElement("div", {
    children: [
      createElement("h1", { children: "Counter" }),
      counterState.useValue((counterValue) =>
        createElement("div", { children: `counter value is: ${counterValue}` })
      ),
      createElement("button", {
        onClick: () => {
          counterState.setValue(
            (currentCounterValue) => currentCounterValue + 1
          );
        },
        children: "+",
      }),
    ],
  });
}
```

### createState and partial subscriptions

If you have an object in your store, even atomic updates will be wasteful. Let's say you have an object with several fields, but you are only interested in the `title` property. If you use `useValue`, it will do unnecessary work. To help with that, there is a `useValueSelector` state method, which accepts a selector function as the first parameter. Here is an example:

```js
import { createElement, createState } from "veles";

function App() {
  const taskState = createState({
    id: 5,
    title: "title",
    description: "long description",
  });
  return createElement("div", {
    children: [
      createElement("h1", { children: "App" }),
      taskState.useSelectorValue(
        (task) => task.title,
        (title) => createElement("div", { children: `task title: ${title}` })
      ),
    ],
  });
}
```

The component which listens for `title` will only be rendered again when the title changes.

### createState and lists

Lists performance is one of the cornerstones of this library, and to help with that, it provides a special state method `useValueIterator`. This method ensures that when the state changes, instead of re-rendering the whole list, it checks each list element individually, moves them into correct order without unnecessary re-renders, and in case of changes element data, it will update the passed state object, so that only subscribed parts will re-render.

> [!NOTE]
> the library determines the uniqueness by calculating the key. You can either pass a string which will be a property name, or you can pass a function which will be executed with the element and the index. If the result is different from any previous calculations, it treats it as a new component.

Let's build a simple list component:

```js
import { createState, createElement } from "veles";

function List() {
  const listState = createState([
    { id: 1, name: "first task" },
    { id: 2, name: "second task" },
    { id: 3, name: "third task" },
  ]);

  return createElement("div", {
    children: [
      createElement("h1", { children: "list" }),
      listState.useValueIterator<{ id: number; name: string }>(
        ({ elementState }) => {
          return createElement("div", {
            children: [
              elementState.useValueSelector((element) => element.name, (name) =>
                createElement("div", { children: name })
              ),
            ],
          });
        },
        { key: "id" }
      ),
    ],
  });
}
```

### createState and attributes

In order to avoid unnecessary re-renders when you to change properties on a wrapper element/component, there is a special state method `useAttribute`. It allows to recalculate value for an attribute every time the state changes, but instead of re-rendering, it calls the `htmlNode.setAttribute` method. Here is an example:

```js
import { createElement, createState } from "veles";

function Counter() {
  const counterState = createState(0);
  return createElement("div", {
    children: [
      createElement("h1", { children: "Counter" }),
      counterState.useValue((counterValue) =>
        createElement("div", { children: `counter value is: ${counterValue}` })
      ),
      createElement("button", {
        onClick: () => {
          counterState.setValue(
            (currentCounterValue) => currentCounterValue + 1
          );
        },
        style: counterState.useAttribute(
          (currentValue) => `width: ${50 + currentValue}px;`
        ),
        children: "+",
      }),
    ],
  });
}
```

You can see that we dynamically change the width of the button with every press.

### createState and subscribing to updates

What if you don't want to render anything when the value changes, but you want to call your code? The state provides `trackValue` method, which does exactly that. Here is an example:

```js
import { createElement, createState } from "veles";

function Counter() {
  const counterState = createState(0);

  counterState.trackValue((counterValue) => {
    console.log(`new counter value is ${counterValue}`);
  });

  return createElement("div", {
    children: [
      createElement("h1", { children: "Counter" }),
      counterState.useValue((counterValue) =>
        createElement("div", { children: `counter value is: ${counterValue}` })
      ),
      createElement("button", {
        onClick: () => {
          counterState.setValue(
            (currentCounterValue) => currentCounterValue + 1
          );
        },
        children: "+",
      }),
    ],
  });
}
```

This subscription will not cause any re-renders.

### Combining different states

Since `createState` is the only way to add dynamic behaviour to the application, sooner or later you'll need to build UI which depends on several states. To do so, you can use `combineState` function which accepts any amount of state objects, and returns a state object with combined values.

```js
import { createElement, createState } from "veles";

function Counter() {
  const firstcounterState = createState(0);
  const secondCounterState = createState(0);
  const combinedCounterState = combineState(
    (firstValue: number, secondValue) => firstValue + secondValue,
    firstcounterState,
    secondCounterState
  );
  return createElement("div", {
    children: [
      createElement("h1", { children: "Counter" }),
      firstcounterState.useValue((counterValue) =>
        createElement("div", {
          children: `first counter value is: ${counterValue}`,
        })
      ),
      secondCounterState.useValue((counterValue) =>
        createElement("div", {
          children: `second counter value is: ${counterValue}`,
        })
      ),
      combinedCounterState.useValue((counterValue) =>
        createElement("div", {
          children: `combined counter value is: ${counterValue}`,
        })
      ),
      createElement("button", {
        onClick: () => {
          firstcounterState.setValue(
            (currentCounterValue) => currentCounterValue + 1
          );
        },
        children: "add to the first counter",
      }),
      createElement("button", {
        onClick: () => {
          secondCounterState.setValue(
            (currentCounterValue) => currentCounterValue + 1
          );
        },
        children: "add to the second counter",
      }),
    ],
  });
}
```

### Components lifecycle

Right now there are `onMount` and `onUnmount` lifecycle hooks. In your component, just import and call them to add a callback.

> [!NOTE]
> You can only use them during the original initialization of the component. If you want to add some callbacks later, use the same version passed as a second argument to your component

```js
import { createElement, onMount, onUnmount } from "veles";

function App(_props, componentAPI) {
  // could be used as `componentAPI.onMount()`
  onMount(() => {
    console.log("called when the component mounts");
  });
  // could be used as `componentAPI.onUnmount()`
  onUnmount(() => {
    console.log("called when the component unmounts");
  });
  return createElement("div", {
    children: "Application",
  });
}
```
