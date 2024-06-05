---
title: Getting Started
layout: home
nav_order: 1
---

# What is Veles

Veles is a component-based UI library focused on performant updates. It allows you to react to changes in your tracked state and update only the nodes which are affected, be it a Text node, or the attribute of a DOM node, only that part will change without touching anything else.

Veles has special treatment for arrays, meaning that adding new elements, changing existing ones, changing order, or removing elements is efficient and is done with minimal amount of DOM operations.

## Getting Started

You can install Veles from npm:

```sh
npm i --save veles
```

The library is very small ([2.9KB minified and gzipped](https://bundlephobia.com/package/veles)), and at the moment has no dependencies.

Let's build a simple counter application:

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState(0);
  return (
    <div>
      <button onClick={() => counterState.setValue((value) => value + 1)}>
        +
      </button>
      <p>
        {counterState.useValue(value => `current value is ${value}`)}
      <p>
    </div>
  );
}
```

> An important note here is that the `<Counter>` component will never re-render. The only part which will be changing when we click on the button is the Text node.

Now that we have our component ready, we can mount it in the DOM:

```jsx
import { attachComponent } from "veles";

attachComponent({
  htmlElement: document.getElementById("app"),
  component: <Counter />,
});
```

## Advanced example

Let's build an example which showcases more features.

```js
import { createState } from "veles";

let idCounter = 1;
function App() {
  const taskState = createState("");
  const tasksState = createState([]);

  return (
    <div>
      <div>
        <input
          type="text"
          value={taskState.useAttribute()}
          onInput={(e) => taskState.setValue(e.target.value)}
        />
        <button
          onClick={() => {
            tasksState.setValue((tasks) =>
              tasks.concat({ id: idCounter++, title: taskState.getValue() })
            );
          }}
        >
          Add task
        </button>
      </div>
      {tasksState.useValueSelector((tasks) =>
        tasks.length > 0 ? (
          <ul>
            {tasksState.useValueIterator({ key: "id" }, ({ elementState }) => (
              <Task taskState={elementState} />
            ))}
          </ul>
        ) : (
          <div>No tasks added yet</div>
        )
      )}
    </div>
  );
}

function Task({ taskState }) {
  return <li>{taskState.useValueSelector((task) => task.title)}</li>;
}
```

As you can see, this is a more complicated example, but it shows almost all the concepts from the library. First, you can see that we reactively assign to `value` attribute of the `<input>` component. As mentioned before, that would not affect anything else excepting changing the attribute on the DOM node.

Second, when we create states, we can still read from them without subscribing. This is especially helpful for callbacks, e.g. creating a new task when we click on the button.

Third, we create a conditional using `useValueSelector` and returning a `boolean` value from the selector function. When the returned value changes, the library will unmount all existing nodes and mount new ones. If the value is the same, the markup will not be re-evaluated and changed.

Last point, we iterate over all tasks using `useValueIterator`. This is an efficient way to make sure that when we add a new task, all existing tasks will not be re-rendered.
