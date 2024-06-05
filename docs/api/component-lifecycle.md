---
layout: default
title: Lifecycle hooks
nav_order: 2
parent: API
---

## Components' lifecycle hooks

Veles is a UI library with composable components. There are no re-renders in this library, and because of that there are only 2 lifecycle events:

- mount
- unmount

There is also `init`, but since the component is executed only once, everything you do in the body of the component becomes the "init" function.
There are 2 ways to access hooks:

```jsx
import { onMount, onUnmount } from "veles";

function VelesComponent(_props, componentAPI) {
  onMount(() => {
    console.log("the component is mounted");
  });
  componentAPI.onMount(() => {
    console.log("the component is mounted #2");
  });
  onUnmount(() => {
    console.log("the component is unmounted");
  });
  componentAPI.onUnmount(() => {
    console.log("the component is unmounted #2");
  });
  return <div>Component body</div>;
}
```

If you add these callbacks in the component's body, there is no difference between them. However, if you add them asynchronously (which maybe you shouldn't), it will not work correctly. In these cases, you can use `componentAPI.onMount/onUnmount` versions, they are tied to the component.

> Right now there is no way to determine whether the component is unmounted
