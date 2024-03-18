import { getComponentVelesNode } from "./utils";

import type { VelesComponent, VelesElement, VelesElementProps } from "./types";

function createElement(
  element: string | Function,
  props: VelesElementProps = {}
): VelesElement | VelesComponent {
  if (typeof element === "string") {
    const { children, ref, onClick, ...otherProps } = props;
    const newElement = document.createElement(element);
    const velesNode = {} as VelesElement;

    if (ref?.velesRef) {
      ref.current = newElement;
    }

    const childComponents: (VelesElement | VelesComponent)[] = [];

    (children || []).forEach((childComponent) => {
      if (typeof childComponent === "string") {
        const text = document.createTextNode(childComponent);
        newElement.appendChild(text);
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesNode" in childComponent &&
        childComponent?.velesNode
      ) {
        // TODO: check that it is a valid DOM Node
        newElement.appendChild(childComponent.html);
        childComponent.parentVelesElement = velesNode;
        childComponents.push(childComponent);
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesComponent" in childComponent &&
        childComponent?.velesComponent
      ) {
        // we need to save the whole components chain, so that
        // we can trigger `mount` hooks on all of them correctly
        const { componentsTree, velesElementNode } =
          getComponentVelesNode(childComponent);

        if (!velesElementNode) {
          console.error("can't find HTML tree in a component chain");
        } else {
          newElement.appendChild(velesElementNode.html);
          componentsTree.forEach((component) => {
            component._privateMethods._callMountHandlers();
          });
          velesElementNode.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        }
      }
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

    // we need to assign attributes after `velesNode` is initialized
    // so that we can correctly handle unmount callbacks
    Object.entries(otherProps).forEach(([key, value]) => {
      if (typeof value === "function" && value.velesAttribute === true) {
        const attributeValue = value(newElement, key, velesNode);
        newElement.setAttribute(key, attributeValue);
      } else {
        newElement.setAttribute(key, value);
      }
    });

    if (onClick) {
      newElement.addEventListener("click", onClick);
    }

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
    const velesComponent: VelesComponent = {
      velesComponent: true,
      tree: element(props, componentAPI),
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
