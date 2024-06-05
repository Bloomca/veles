---
layout: default
title: createState
nav_order: 1
parent: API
---

## Veles.createState

`createState` allows you to introduce interactivity into your Veles applications. Moreover, it is the only way to achieve interactivity, all other data sources will need to be passed into the `createState`.

## Reference

- `createState(initialValue, subscribeCallback?)`

<h4>Parameters<h4>

- `initialValue`: can be any value you want to be the first
- **optional** `subscribeCallback`: a callback which receives `state.setValue` as its argument, and can return a function to cleanup all the subscriptions when the component is unmounted (in case you create the state inside a component)

An example of the counter component with state:

```jsx
import { createState } from "veles";

function Counter() {
  const counterState = createState();
  return (
    <div>
      <button
        onClick={() =>
          counterState.setValue((currentValue) => currentValue + 1)
        }
      >
        +
      </button>
      <p>{counterState.useValue((value) => `counter value is ${value}`)}</p>
    </div>
  );
}
```

## Available methods

A created state object has many methods, including several types of subscriptions, so let's go over them and describe when and how to use each of them.

### `state.setValue`

- `state.setValue(newValue)`
- `state.setValue((currentValue) => newValue)`

First, let's look at how to update values. You can either call `setValue` with the new value outright, or you can pass a callback which will receive the current value as the first argument. When this function is called and the new value is different from the previous one (it uses referential equality check, `===`), all subscriptions will be called.

> If you store functions in the state, you need to use the callback variant

### `state.useValue`

- `state.useValue()`
- `state.useValue(currentValue => Veles.Node, comparator?)`

`useValue` provides a way to return a dynamic HTML markup. Every time there is a new value in state, it will execute the provided callback and replace the old markup with the new one. You can also pass a custom `comparator` function which will receive two arguments, `prevValue` and `newValue`, and expect to receive a `boolean` whether they are equal or not. Again, by default it uses `===` to check the values.

You can return any valid Veles node. It can be a `string`, `number`, `undefined`, `null`, a JSX element or a component.

> In case you call this method without any parameters, it will assume that you return the value, so it is identical to `state.useValue(value => value)`

### `state.useValueSelector`

- `state.useValueSelector(value => newValue)`
- `state.useValueSelector(value => newValue, newValue => Veles.Node, comparator?)`

`useValueSelector` is a very similar method to the previous one, but it allows to change the value first. This is helpful for several reasons. First, it is more efficient, e.g. if you store an object in the state and render a property (for example, `task.title`), it makes sense to re-render that Text node only when the actual `title` changes.

Second, it is very convenient for efficient conditionals. Let's say that you want to render something in case the string is longer than a certain amount of characters. We can do it two ways:

```jsx
<div>
  {titleState.useValue((title) => (title.length > 100 ? <Warning /> : null))}
  {titleState.useValueSelector(
    (title) => title.length > 100,
    isTooLong ? <Warning /> : null
  )}
</div>
```

The second option is a much better one. There would be very small difference between them with simple components, but once you start mounting more elaborate components, constant unmounting and remounting will add up and slow down your application.

### `state.useValueIterator`

- `state.useValueIterator({ key: 'id' }, ({ elementState }) => <Element state={elementState} />)`
- `state.useValueIterator({ key: 'id', selector?: stateValue => newValue }, ({ elementState }) => <Element state={elementState} />)`
- `state.useValueIterator({ key: (element) => element.id }, ({ elementState }) => <Element state={elementState} />)`

The first argument is an object with a required `key` property, which either needs to be a string with the name of the property you want to use as a key for all elements (usually it is `id`), or you can pass a function and return a string to uniquely identify each element.
The second argument is a callback which receives an argument with an object with `elementState` and `indexState` properties. Both of these are states, and if you need to display values, you need to subscribe to them (probably with `useValue/useValueSelector`).

---

`useValueIterator` needs to be used on every array value which returns markup. The reason for that is there are several optimizations:

- the whole array is rendered only one time
- after that any changes to the array will cause to compare every item by key, and only the following will be done:
  - in the event of a new item, all existing ones will not be touched, and only new HTML node will inserted at the correct place
  - in the event of removing an item, only that specific node will be removed from HTML
  - in the event of changing order, nothing will be changed except the library will change the order of HTML nodes (components will not be created again)
  - in the event of some item changing (e.g. a property changed), nothing will be re-rendered. However, each item receives a state with the item inside, so only if you are subscribed to the relevant part, only that node (but not the whole component) will be re-rendered

As you can see, any changes to the array will cause the least amount of HTML removed/inserted, which is usually the heaviest operation. If you have large lists, this function can be extremely beneficial.

Consider this scenario. We have a project with 10 sections, and each section has 5-15 tasks, and we render all sections in a list with tasks listed under each relevant section. What happens if we add one more section? In our case, only new section and its tasks will be rendered. What happens if a section changes its name? Only subscriptions which use the whole section and the section name will be called, which probably is only the section name text node.

### `state.useAttribute`

- `state.useAttribute()`
- `stte.useAttribute(value => attributeValue)`

`useAttribute` must be used to update attributes of a DOM node. When used without any arguments, it will simply return the value (so, it is equivalent to `useAttribute(value => value)`). Right now there is no version of `useAttributeSelector`, and it will also update the property every time the value changes (even if it is the same). This will likely get addressed in the future.

### `state.trackValue`

- `state.trackValue(cb)`
- `state.trackValue(cb, options?: { callOnMount, skipFirstCall, comparator })`

`trackValue` is used if you want to subscribe to the state outside of the markup and perform some side effects. It will be called every time the value changes, unless you provide a comparator function in options, which allows you to fine tune. That being said, if you need to subscribe to specific updates, it is usually better to use `trackValueSelector`.

By default, the first call is executed immediately, before the markup is in the DOM. You can change that to either call once HTML is up-to-date with `callOnMount: true`, or you can skip the first call altogether with `skipFirstCall: true`. If both are `true`, the first call will be skipped anyway.

It will automatically clean up the subscription callback once the component is unmounted.

### `state.trackValueSelector`

- `state.trackValue(selector, cb)`
- `state.trackValue(selector, cb, options?: { callOnMount, skipFirstCall, comparator })`

Similar to `trackValue`, this function is executed only when the state value changes and `selector` returns a different value. By default, it uses referential equality (`===` operator), and you can override it with a custom `comparator` option.

### `state.getValue`

- `state.getValue()`

Read the latest value synchronously. Usually you should never use this function for the markup as you'll not get the reactivity, and it is mostly used to read current value in the event handlers (e.g. read all the entered data when user creates some new content; we don't need to track that in the handler).

### `state.getPreviousValue`

- `state.getPreviousValue()`

Allows you to read _previous value_. You can read it in callbacks for any subscription, in case you want to do something special; e.g. you might want to fetch some data based on the previous and the next values.
