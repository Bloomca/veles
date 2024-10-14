---
layout: default
title: Portals
nav_order: 9
parent: API
---

## Portals

If you want to render a part of your application in a different part of the DOM, but want to maintain a logical structure in your components, you can use the `<Portal>` component. This components accepts two props:

- `portalNode`: an HTML component where children will be mounted
- `children`: any valid Veles children components

## Example

```jsx
import { Portal, useState } from "veles";

function Component() {
  const showMenu = useState(false);
  return (
    <div
      onMouseOver={() => showMenu.setState(true)}
      onMouseOut={() => showMenu.setState(false)}
    >
      <h1>Title</h1>
      {showMenu.useValue((shouldShow) =>
        shouldShow ? (
          <Portal portalNode={document.getElementById("portal")}>
            <div>Component menu</div>
          </Portal>
        ) : null
      )}
    </div>
  );
}
```

This is a simple example of a menu which will be rendered when we hover over the component, but instead of the app DOM tree, it will use the node with `portal` ID.

## Caveats

If you render multiple Portals to the same `portalNode`, the initial order will be correct. However, if you render Portals conditionally, they will be added to the end of HTML node at the time of their rendering, not respecting the order in the markup. I don't consider it as a bug at the moment, feel free to create an issue if that causes problems.
