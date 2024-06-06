---
layout: default
title: createElement
nav_order: 4
parent: API
---

## JSX code under the hood

In general, you probably want to use JSX and setup the conversion in your JavaScript transpiler (like [Babel](https://babeljs.io/docs/babel-plugin-transform-react-jsx#react-automatic-runtime)) once and write markup the same way as other React-like frameworks operate. Under the hood, there is `createElement` function, and you can create Veles Nodes with it directly:

```js
import { createElement } from "veles";

function Component() {
  return createElement("div", {
    children: [
      createElement("h1", { children: "component" }),
      createElement(NestedComponent),
    ],
  });
}

function NestedComponent() {
  return createElement("h2", { children: "nested component" });
}
```

It is equivalent to this JSX code:

```jsx
function Component() {
  return (
    <div>
      <h1>component</h1>
      <NestedComponent />
    </div>
  );
}

function NestedComponent() {
  return <h2>nested component</h2>;
}
```

## Fragment

Similar to React, there is a `<Fragment>` component available:

```jsx
import { Fragment } from "veles";

function Component() {
  return (
    <div>
      <Fragment>
        <div>element 1</div>
        <div>element 2</div>
      </Fragment>
    </div>
  );
}
```
