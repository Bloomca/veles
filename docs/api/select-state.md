---
layout: default
title: selectState
nav_order: 8
parent: API
---

## selectState

> Note: this function needs to be imported from `"veles/utils"`

> This function is also available as `select`

When working with multiple states, often by using [combineState](./combine-state.html), you end up with not the ideal state value representation. E.g. if you want to pass it down as a property to multiple component, you might want to avoid doing the same selector work on all of them, and want to do them at once. It becomes even more important if you want to combine that state with something else.

To change the state value, you can use `selectState`/`select` functions. Here is an example:

```jsx
import { createState } from "veles";
import { combineState, selectState } from "veles/utils";

function Component() {
  const nameState = createState("");
  const lastNameState = createState("");
  const fullNameState = selectState(
    combineState(nameState, lastNameState),
    ([firstName, lastName]) => `${firstName} ${lastName}`
  );

  return (
    <div>
      <input
        type="text"
        name="name"
        onInput={(e) => nameState.setValue(e.target.value)}
        value={nameState.useAttribute()}
      />
      <input
        type="text"
        name="lastName"
        onInput={(e) => lastNameState.setValue(e.target.value)}
        value={lastNameState.useAttribute()}
      />
      {fullNameState.useValue((fullName) => `Full name is ${fullName}`)}
    </div>
  );
}
```
