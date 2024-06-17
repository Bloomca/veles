---
layout: default
title: Understanding components lifecycle
nav_order: 4
parent: Guides
---

## Components lifecycle in detail

Veles uses a different approach to updating components compared to some other frameworks. Instead of listening to all changes within a component and updating the output (potentially using an algorithm to compare old and new markup to avoid inserting/removing too much), all subscriptions create independent listeners and when the value changes (or provided selector returned a different value), it will completely unmount the previous components, build a new component tree using the new value, and then mount it into the HTML instead of the old node.

While this sounds more work than the approach with updates, in reality there should be no situations where we replace DOM nodes with pretty much the same HTML structure; in case that happens, it means our subscriptions are not atomic enough. In a lot of cases, the only things updating will be various text nodes and DOM node attributes.

## Lifecycle steps

Because of that the components lifecycle is the following:

1. The body of the component is executed exactly 1 time, right before the component is about to be mounted in DOM. You can perform any calculations and save results in a variable, and every subscription can access it. The most useful part of it is probably creating new state primitives and passing it around.
2. Once the component is mounted, `onMount` handlers are called. All the markup will be available, all `createRef` assigned to DOM nodes will have correct values as well.
3. Once the component is removed from DOM, `onUnmount` handlers are called. Once they are done, the component will be removed and subsequent renders of the same component (e.g. if it is rendered conditionally) will cause the same lifecycle steps to be executed again. All subscriptions from the state primitive (like `state.trackValue`, `state.useValue`, etc) will be cleaned up automatically.

## Props updates

It is important to note that props cannot change. The only way to receive different props is to unmount the component and then mount it again with different prop values.

You might think that passing direct object values is the way to go, e.g. something like this:

```jsx
function Component({ task }) {
    return <div>{task.name}</div>
}
```

But in general for dynamic content you want to avoid it as much as possible and pass data wrapped in `state` and let children decide how they want to consume it. For example, the same component will look like this:

```jsx
function Component({ taskState }) {
 return <div>{taskState.useValueSelector(task => task.name)}</div>
}
```

This way the only thing which will change is that specific text node. You can pass the state to each component, and they will subscribe only in places where it is relevant, and this way all DOM updates will be minimal and only when something changes. Essentially this means that when something changes in a parent component, it does not always mean that children will need to be re-rendered as well; updates are often can be localized.

