---
layout: default
title: TypeScript support
nav_order: 4
---

The library itself is written in TypeScript, so you can import type definitions without installing an additional types library. That being said, the types are not perfect (for example, you need to manually select element type for `useValueIterator<Value>`, even if the state value is `State<Value[]>`), and hopefully I will be able to improve that in the future.
