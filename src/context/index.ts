import { Fragment } from "../fragment";
import { createElement } from "../create-element";

import type { VelesChildren } from "../types";
import type { ComponentContext } from "./types.d.ts";

// the name is so convoluted because we also
// use context stack for lifecycle
const publicContextStack: ComponentContext[] = [];

let contextIdCounter = 1;
function createContext<T>() {
  // unique context id
  const contextId = contextIdCounter++;
  function addContext(value: T) {
    const currentContextObject =
      publicContextStack[publicContextStack.length - 1];

    if (!currentContextObject) {
      // either executed outside of the rendering framework
      // or some bug
      console.error("cannot add Context due to missing stack value");
    } else {
      publicContextStack[publicContextStack.length - 1] = {
        ...currentContextObject,
        [contextId]: value,
      };
    }
  }
  return {
    Provider: ({ value, children }: { value: T; children: VelesChildren }) => {
      addContext(value);
      return createElement(Fragment, { children });
    },
    addContext,
    readContext: (): T => {
      const currentContext = publicContextStack[publicContextStack.length - 1];

      if (!currentContext) {
        // we are outside the context somehow
        console.error("no Context currently available");
      } else {
        return currentContext[contextId];
      }
    },
  };
}

function addPublicContext(specificContext?: ComponentContext) {
  if (specificContext) {
    publicContextStack.push(specificContext);
  } else {
    if (publicContextStack.length === 0) {
      publicContextStack.push({});
    } else {
      const currentContext = publicContextStack[publicContextStack.length - 1];
      publicContextStack.push(currentContext);
    }
  }
}

function popPublicContext() {
  publicContextStack.pop();
}

// this function is needed to save current context to re-execute components
// which are mounted conditionally
function getCurrentContext() {
  return publicContextStack[publicContextStack.length - 1];
}

export { createContext, addPublicContext, popPublicContext, getCurrentContext };
