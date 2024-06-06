---
layout: default
title: combineState
nav_order: 6
parent: API
---

## combineState

> Note: this function needs to be imported from `"veles/utils"`

> This function is also available as `combine`

Sooner or later you'll run into a situation where you depend on several states. While in theory you can make a subscription inside another one and access both current values that way, you should not do that. Not only it is cumbersome to write, it is also not very flexible and can't be used with other states.

To help with that, there is a `combineState` or `combine` function, which merges several states together for you. It accepts any number of states and creates a new state which will have an array with values from all passed states.

```jsx
import { createState } from "veles";
import { combineState } from "veles/utils";

function Component() {
  const nameState = createState("");
  const lastNameState = createState("");
  const fullNameState = combineState(nameState, lastNameState);

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
      {fullNameState.useValueSelector(
        ([firstName, lastName]) => `Full name is ${firstName} ${lastName}`
      )}
    </div>
  );
}
```

The advantage here is that we can combine several states, we can pass that state down as a prop to another components, we can use `trackValue` and do side-effects when either of them change.
