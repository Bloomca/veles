import { ComponentAPI } from "../types";

// lifecycle hooks
// currently, all components need to be synchronous
// so we execute them and set background context
// since components can be nested, we need to use the stack
const contextStack: ComponentAPI[] = [];
// all hooks need to know the current context
// it should be way more convenient to use it this way
// compared to passing `componentAPI` to every method
let currentContext: ComponentAPI | null = null;

function addContext(newContext: ComponentAPI) {
  contextStack.push(newContext);
  currentContext = newContext;
}

function popContext() {
  contextStack.pop();
  currentContext = contextStack[contextStack.length - 1];
}

// You can return a function from the mount callback, and it will be
// automatically registered as `onUnmount` callback
function onMount(cb: () => void | Function) {
  if (currentContext) {
    currentContext.onMount(cb);
  } else {
    console.error("missing current context");
  }
}

function onUnmount(cb: Function) {
  if (currentContext) {
    currentContext.onUnmount(cb);
  } else {
    console.error("missing current context");
  }
}

export { addContext, popContext, onMount, onUnmount };
