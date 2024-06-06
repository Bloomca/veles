---
layout: default
title: createElement
nav_order: 5
parent: API
---

## createRef

Since components don't re-render, and the component's code is executed only one time when the component is being mounted, you probably don't need refs for anything except for more convenient access to DOM elements. Every element accepts `ref` and it will be assigned the correct HTML node at the time of execution. If you want to pass the ref down, there is no need for wrapping components into anything, just pass it as any other prop (`ref` on components is ignored and treated like any other property).

```jsx
import { createRef } from "veles";
function App() {
  const inputRef = createRef();

  return (
    <div>
      <button
        onClick={() => {
          inputRef.current?.focus();
        }}
      >
        focus input
      </button>
      <input type="text" ref={inputRef} />
    </div>
  );
}
```
