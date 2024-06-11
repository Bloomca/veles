---
layout: default
title: Differences from other frameworks
nav_order: 4
---

## Differences from other frameworks

The main difference with other reactive based frameworks is that the tracking primitive (`createState` in Veles' case) allows for specific subscriptions, and that arrays are highly optimized and effectively will be rendered only one time, and all subsequent updates will only cause atomic changes in actual HTML.

Let's compare with a couple of popular libraries:

### React

Veles aims for a very similar composability as React provides, so the component approach should be pretty close, allowing for passing JSX down as props, logic reusability, etc.
Underneath there is a very big difference between these libraries. React re-renders components as soon as any of their internal states change, and then builds that into an internal presentation (Virtual DOM), and after comparing the existing and the new structure, applies updates to the changed components.

Veles approaches updates differently. Instead of global component state updates, all changes are atomic, and updates are applied only to relevant subscriptions. There is also no diffing algorithm, meaning that in case there is a new state, all subscribers will re-execute their code. Because of that, there is no concept of re-rendering, components mount only one time.

## Solidjs

[Solidjs](https://www.solidjs.com/) is a very close library to Veles conceptually. It also has atomic updates, the state primitive (Signals) is close to `createState`, and component lifecycle is pretty much identical: the body is executed one time, and then there is `mount` and `cleanup` events.

The implementation is slightly different. Solidjs tries to be more streamlined in its API, working as expected in most cases, but that comes with the expense that if you need a bit different approach, it might be a bit more cumbersome. By default Solidjs' Signal primitive does not allow for selector subscriptions; it does have a way to do so, but you need to use a different primitive for it.

You need to use specific components for control flows in Solidjs (conditionals, arrays), and also array elements are non-dynamic, which can cause potential issues if you have nested array within arrays.

Overall, with the correct approach, both libraries should give you good interactive performance.

## Veles' drawbacks

The library is pretty much in alpha state, and there are several missing concepts:

- Portals
- Not ideal TypeScript support
- No server rendering (this one is not planned to be supported)
