import { parseChildren } from "./parse-children";
import { assignAttributes } from "./assign-attributes";
import { parseComponent } from "./parse-component";

import type {
  VelesComponent,
  VelesElement,
  VelesElementProps,
  ComponentFunction,
} from "../types";

function createElement(
  element: string | ComponentFunction,
  props: VelesElementProps = {}
): VelesElement | VelesComponent {
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
    let unmountHandlers: Function[] = [];
    const callUnmountHandlers = () => {
      unmountHandlers.forEach((cb) => cb());
      unmountHandlers = [];

      childComponents.forEach((childComponent) => {
        childComponent._privateMethods._callUnmountHandlers();
      });
    };

    velesNode.html = newElement;
    velesNode.velesNode = true;
    velesNode.childComponents = childComponents;
    velesNode.phantom = phantom;
    velesNode._privateMethods = {
      _addUnmountHandler: (cb: Function) => {
        unmountHandlers.push(cb);
      },
      _callUnmountHandlers: callUnmountHandlers,
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
