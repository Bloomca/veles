# Veles

![Tests status](https://github.com/bloomca/veles/actions/workflows/pull-request-workflow.yaml/badge.svg)
[![Build Size](https://img.shields.io/bundlephobia/minzip/veles?label=bundle%20size)](https://bundlephobia.com/result?p=veles)
[![Version](https://img.shields.io/npm/v/veles)](https://www.npmjs.com/package/veles)

> This library is still in early stages, so the API is not 100% finalized

`Veles` is a component-based performance-focused UI library. The main goal of this library is to provide a composable way to build highly interactive interfaces, which should be performant out of the box, as long as you follow the recommendations.

## Performance

This library's primary focus is in performance. What this means is that it allows you to write your code in a way which will ensure that when the data in your app changes, only the smallest relevant parts will update. Despite of similarities with React in syntax, it does not follow the same waterfall style for component re-renders. Instead, it gives you API to subscribe to atomic changes in your tracked state and re-render only parts of the UI which actually depend on the value. Internally, it renders new HTML and replaces the old node. A similar approach is done for attributes, where in case of changes, only the relevant attribute will be updated in place, but nothing else will change.

It is important to note that the performance benefits will only be observed (and relevant as well) in case of a pretty high interactivity. It might not be faster than any other UI framework on the first render, the biggest improvement lies in the power of subscribing to individual changes, which is especially powerful in case of lists.

## Installation

The library is available on npm. To add it to your project, execute this in your project folder:

```sh
npm install --save veles
```

Types are installed automatically with the same package.

## A basic example

```jsx
import { createState } from "veles";

function NameComponent() {
  const nameState = createState("");
  return (
    <div>
      <input
        type="text"
        name="name"
        value={nameState.useAttribute()}
        onInput={(e) => nameState.setValue(e.target.value)}
      />
      <p>{nameState.useValue()}</p>
    </div>
  );
}
```

This will render an input and will update the Text node dynamically, without re-rendering the whole component. For a more advanced example, please head to [the docs](https://bloomca.github.io/veles/#advanced-example).

### Resources

- [Getting started](https://bloomca.github.io/veles/)
- [API docs](https://bloomca.github.io/veles/api/)
- [Guides](https://bloomca.github.io/veles/guides/)
- [Differences from other frameworks](https://bloomca.github.io/veles/frameworks-difference.html)

There also a companion app ([veles-calendar-app](https://github.com/Bloomca/veles-calendar-app)), which is developed using Veles and is supposed to push it to the limits, identify the issues and ideally improve performance even more.

### Features

The library is under development, so some features are not available yet. Namely the TypeScript type inferring is not the best (although the library does support TypeScript), and Portals are not implemented yet.
