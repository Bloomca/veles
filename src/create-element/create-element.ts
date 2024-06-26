import { parseChildren } from "./parse-children";
import { assignAttributes } from "./assign-attributes";
import { parseComponent } from "./parse-component";

import type {
  VelesComponentObject,
  VelesElement,
  VelesElementProps,
  ComponentFunction,
} from "../types";

function createElement(
  element: string | ComponentFunction,
  props: VelesElementProps = {}
): VelesElement | VelesComponentObject {
  if (typeof element === "string") {
    const { children, ref, phantom = false, ...otherProps } = props;

    const newElement = document.createElement(element);
    const velesNode = {} as VelesElement;

    if (ref?.velesRef) {
      ref.current = newElement;
    }

    const childComponents = parseChildren({
      children,
      htmlElement: newElement,
      velesNode,
    });

    // these handlers are attached directly to the DOM element
    // specifically, the top level node which is rendered after
    // using `useValue` function and also listeners from
    // `useAttribute`
    const unmountHandlers: Function[] = [];
    velesNode.html = newElement;
    velesNode.velesNode = true;
    velesNode.childComponents = childComponents;
    velesNode.phantom = phantom;

    // these handlers are used to start tracking `useValue` only when the node
    // is actually mounted in the DOM
    const mountHandlers: Function[] = [];
    velesNode._privateMethods = {
      _addMountHandler(cb: Function) {
        mountHandlers.push(cb);
      },
      _callMountHandlers() {
        mountHandlers.forEach((cb) => cb());
      },
      _addUnmountHandler(cb: Function) {
        unmountHandlers.push(cb);
      },
      _callUnmountHandlers() {
        unmountHandlers.forEach((cb) => cb());
      },
    };

    // assign all the DOM attributes, including event listeners
    assignAttributes({ props: otherProps, htmlElement: newElement, velesNode });

    return velesNode;

    // functions mean that we want to render another component
  } else if (typeof element === "function") {
    return parseComponent({ element, props });
  }

  // otherwise we use the API wrong, so we throw an error
  throw new Error(
    "Veles createElement expects a valid DOM string or another component"
  );
}

export { createElement };
