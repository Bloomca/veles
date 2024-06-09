/**
 * This is an internal helper function to create Text Nodes
 * which we need to maintain in the component tree
 */

import type { VelesStringElement } from "../types";

export function createTextElement(
  text: string | undefined | null
): VelesStringElement {
  let mountHandlers: Function[] = [];
  let unmountHandlers: Function[] = [];
  return {
    velesStringElement: true,
    // in case there is no text, we create an empty Text node, so we still can
    // have a reference to it, replace it, call lifecycle methods, etc
    html: document.createTextNode(text || ""),

    _privateMethods: {
      _addMountHandler(cb: Function) {
        mountHandlers.push(cb);
      },
      _callMountHandlers() {
        mountHandlers.forEach((cb) => cb());
        mountHandlers = [];
      },
      _addUnmountHandler: (cb: Function) => {
        unmountHandlers.push(cb);
      },
      _callUnmountHandlers: () => {
        unmountHandlers.forEach((cb) => cb());
        // unmountHandlers = [];
      },
    },
  };
}
