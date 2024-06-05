---
layout: default
title: Differences from other frameworks
nav_order: 5
---

## Differences from other frameworks

The main difference with other reactive based frameworks is that the tracking primitive (`createState` in Veles' case) allows for specific subscriptions, and that arrays are highly optimized and effectively will be rendered only one time, and all subsequent updates will only cause atomic changes in actual HTML.

## Veles' drawbacks

The library is pretty much in alpha state, and there are several missing concepts:

- Context
- Portals
- No server rendering (this one is not really planned)
- Not ideal TypeScript support
