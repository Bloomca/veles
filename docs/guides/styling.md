---
layout: default
title: Styling
nav_order: 3
parent: Guides
---

## Styling

Veles supports styling through regular CSS classes and inline `style` attributes. You can bind both using the [attribute](../api/create-state-component-bindings.html#stateattribute) API.

## CSS classes

In order to assign classes to an element, use `class` attribute:

```jsx
function Button() {
  return <button class="primary-button">Save</button>;
}
```

If you want to make it conditional, use the `attribute()` API:

```jsx
function Button({ active$ }) {
  return <button class={active$.attribute(isActive => isActive ? 'active' : '')}>Save</button>;
}
```

## Style property

The `style` property can be passed as a CSS string:

```jsx
function Component() {
  return <div style="color: red; background-color: blue;" />;
}
```

It can also be passed as an object:

```jsx
function Component() {
  return (
    <div
      style={{
        "background-color": "blue",
        "--accent-color": "red",
        color: "var(--accent-color)",
      }}
    />
  );
}
```

Currently, you need to pass both the keys and the values exactly as they appear in the CSS. So you need to use kebab case for properties like `border-color` and manually append `px` where appropriate (like for width, font size, etc).
If you want to make it dynamic, you can utilize the `attribute()` API as well:

```jsx
function Component({ value$ }) {
  return (
    <div
      style={value$.attribute(value => ({ width: `${value}px`}))}
    />
  );
}
```

Using the object will only update/remove/add changes keys, which is a minor optimization.
