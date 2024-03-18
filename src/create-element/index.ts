import { parseChildren } from "./parse-children";
import { assignAttributes } from "./assign-attributes";

import type { VelesComponent, VelesElement, VelesElementProps } from "../types";

function createElement(
  element: string | Function,
  props: VelesElementProps = {}
): VelesElement | VelesComponent {
  if (typeof element === "string") {
    const { children, ref, ...otherProps } = props;
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
    const componentUnmountCbs: Function[] = [];
    const componentMountCbs: Function[] = [];
    const componentAPI: {
      onMount: (cb: Function) => void;
      onUnmount: (cb: Function) => void;
    } = {
      onMount: (cb) => {
        componentMountCbs.push(cb);
      },
      onUnmount: (cb) => {
        componentUnmountCbs.push(cb);
      },
    };
    // at this moment we enter new context
    const componentTree = element(props, componentAPI);
    // here we exit our context
    const velesComponent: VelesComponent = {
      velesComponent: true,
      tree: componentTree,
      _privateMethods: {
        _addUnmountHandler: (cb: Function) => {
          componentAPI.onUnmount(cb);
        },
        _callMountHandlers: () => {
          componentMountCbs.forEach((cb) => cb());
        },
        _callUnmountHandlers: () => {
          componentUnmountCbs.forEach((cb) => cb());
          // this should trigger recursive checks,
          // whether it is a VelesNode or VelesComponent
          velesComponent.tree._privateMethods._callUnmountHandlers();
        },
      },
    };

    return velesComponent;

    // TODO: handle `children` property in the context of the current component
    // mostly to simplify `key` management (they will need to be unique only
    // within the render method)
  }

  // otherwise we use the API wrong, so we throw an error
  throw new Error(
    "Veles createElement expects a valid DOM string or another component"
  );
}

export { createElement };
