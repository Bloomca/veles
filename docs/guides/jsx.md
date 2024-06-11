---
layout: default
title: JSX setup
nav_order: 2
parent: Guides
---

## JSX implementation

JSX itself is a pretty standard React-like implementation. It does have a few quirks:

- you need to use `class` instead of `className` (this will be aliased in the future)
- `onChange` event works according to the spec ([ref](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event)), and it won't be fired after every input update. So you probably want to use `onInput` for now (it will also be aliased in the future)

## JSX setup

To setup it up, you need to use "automatic" JSX runtime (the new version, the "classic" is not supported). For example, in Babel you need to specify:

```js
[
  "@babel/preset-react",
  {
    runtime: "automatic", // defaults to classic
    importSource: "veles", // defaults to react
  },
];
```
