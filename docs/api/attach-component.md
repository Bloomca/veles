---
layout: default
title: attachComponent
nav_order: 3
parent: API
---

# Attach Veles application to DOM

- `attachComponent({ htmlElement, component })`

Attaches your Veles node to a regular HTML node. Pretty straightforward:

```js
import { attachComponent } from "veles";

const removeVelesTree = attachComponent({
  htmlElement: document.getElementById("app"),
  component: <App />,
});
```

This function returns another function, which will remove the tree from DOM.

> Right now it will wrap your Veles application in an additional `<div>`. I expect it to go in the future, but for now keep this in mind
