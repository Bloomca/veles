import type { VelesElement, VelesElementProps } from "./types";

function createElement(
  element: string | Function,
  props: VelesElementProps = {}
): VelesElement {
  if (typeof element === "string") {
    const { children, ref, onClick, ...otherProps } = props;
    const newElement = document.createElement(element);
    const velesNode = {} as VelesElement;
    Object.entries(otherProps).forEach(([key, value]) => {
      if (typeof value === "function" && value.velesAttribute === true) {
        const attributeValue = value(newElement, key);
        newElement.setAttribute(key, attributeValue);
      } else {
        newElement.setAttribute(key, value);
      }
    });

    if (onClick) {
      newElement.addEventListener("click", onClick);
    }

    if (ref?.velesRef) {
      ref.current = newElement;
    }

    const childComponents: VelesElement[] = [];

    (children ?? []).forEach((childComponent) => {
      if (typeof childComponent === "string") {
        const text = document.createTextNode(childComponent);
        newElement.appendChild(text);
      } else if (
        typeof childComponent === "object" &&
        childComponent?.velesNode
      ) {
        // TODO: check that it is a valid DOM Node
        newElement.appendChild(childComponent.html);
        childComponent.parentVelesElement = velesNode;
        childComponents.push(childComponent);
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
        childComponent._callUnmountHandlers();
      });
    };

    Object.assign(velesNode, {
      html: newElement,
      velesNode: true,
      childComponents,
      _addUnmountHandler: (cb: Function) => {
        unmountHandlers.push(cb);
      },
      _callUnmountHandlers: callUnmountHandlers,
    });

    return velesNode;

    // functions mean that we want to render another component
  } else if (typeof element === "function") {
    const componentAPI: {
      _unmountCbs: Function[];
      onUnmount: (cb: Function) => void;
    } = {
      _unmountCbs: [],
      onUnmount: (cb) => {
        componentAPI._unmountCbs.push(cb);
      },
    };
    return element(props, componentAPI);

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
