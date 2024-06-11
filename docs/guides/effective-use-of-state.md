---
layout: default
title: Effective use of State
nav_order: 1
parent: Guides
---

## Subscribe to smallest changes

Veles allows you to subscribe to individual updates on very granular level, down to text nodes. Imagine you have a `task` state, and you do something like this:

```jsx
<div>
  {taskState.useValue((task) => (
    <div>
      <h2>{task.name}</h2>
      <p>{task.description}</p>
    </div>
  ))}
</div>
```

In this example when something in the `task` changes, this component will be unmounted, executed again and then mounted back. Not only it means that when the `name` changes, the description node will be re-executed again, but also it something _else_ changes, like labels or updated time, this whole component will be re-evaluated. Instead, use granular subscriptions:

```jsx
<div>
  <div>
    <h2>{taskState.useValueSelector((task) => task.name)}</h2>
    <p>{taskState.useValueSelector((task) => task.description)}</p>
  </div>
</div>
```

While it looks like a small thing, remember that it could be a much bigger component, there could be a lot of them in the list, and also that DOM operations are by far the most expensive thing in terms of performance hit.

## Efficient conditional checks

When you decide what to render based on some condition, remember that `useValueSelector` will not re-execute it if the returned value did not change. This means that you should always strive for returning primitive values (`boolean`, `number`, `string`, `undefined` and `null`). If you need to access some state properties inside the component, create another subscription there. This is how an efficient code would look like:

```jsx
<div>
  {taskState.useValueSelector(
    (task) => task.labels.length > 5,
    (showLabels) =>
      showLabels ? (
        <ItemWithLabels taskState={taskState} />
      ) : (
        <Item taskState={taskState} />
      )
  )}
</div>
```

You can see that I pass `taskState` to both components, and they can subscribe to individual changes inside. Only when our condition changes, we'll render a different component.

## Working with multiple states

Let's say you have several states and you need to select some data based on both of them. To work with them efficiently, use `combineState` and `selectState`:

```jsx
// these are aliases for combineState and selectState
import { combine, select } from "veles/utils";

function projectTasks({ projectState, tasksState }) {
  const projectIdState = select(projectState, (project) => project.id);
  const projectTasksState = select(
    combine(projectIdState, tasksState),
    ([projectId, tasks]) => tasks.filter((task) => task.projectId === projectId)
  );
}
```

As you can see, first I created a new state to return only `id`, because for the task list we do not care if something else except the `id` changes. After that we build a state which contains only relevant tasks, and it will be easier to work with.
