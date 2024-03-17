# Veles

> The library is in very early stages and is not published yet as some crucial APIs are still under development

`Veles` is a component-based performance-focused UI library. The main goal of this library is to provide a composable way to build highly interactive interfaces, which should be performant out of the box, as long as you follow the recommendations.

## Performance

This library's primary focus is in performance. What this means is that it allows you to write your code in a way which will ensure that when the data in your app changes, only the smallest relevant parts will update. Despite of similarities with React in syntax, it does not follow the same waterfall style for component re-renders. Instead, it gives you API to subscribe to atomic changes in your tracked state and re-render only parts of the UI which actually depend on the value. Internally, it renders new HTML and replaces the old node. A similar approach is done for attributes, where in case of changes, only the relevant attribute will be updated in place, but nothing else will change.

It is important to note that the performance benefits will only be observed (and relevant as well) in case of a pretty high interactivity. It might not be faster than any other UI framework on the first render, the biggest improvement lies in the power of subscribing to individual changes.

## Example

Here is a rough example of a counter application (right now in plain JavaScript, but it should be possible to use JSX by specifying custom pragma):

```js
import { attachComponent, createElement, createState } from "veles";

function App() {
  const counterState = createState(0);
  return createElement("div", {
    children: [
      "Veles app with a counter",
      counterState.useValue((value) =>
        createElement("div", { children: [`current counter value: ${value}`] })
      ),
      createElement("div", { children: ["test"] }),
      createElement(Button, { counterState }),
    ],
  });
}

function Button({ counterState }) {
  return createElement("button", {
    onClick: () => {
      counterState.setValue((currentValue) => currentValue + 1);
    },
    children: ["+", createElement("div", { children: ["hello"] })],
    style: counterState.useAttribute(
      (currentValue) => `width: ${50 + currentValue}px;`
    ),
  });
}

const appContainer = document.getElementById("app");

if (appContainer) {
  attachComponent({ htmlElement: appContainer, component: createElement(App) });
}
```
