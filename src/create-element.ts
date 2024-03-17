import type { VelesElement, VelesElementProps } from "./types";

// convert components into regular DOM elements
// supports nested components
function createElement(
  element: string | Function,
  props: VelesElementProps = {}
): VelesElement {
  if (typeof element === "string") {
    const { children, ref, onClick, ...otherProps } = props;
    const newElement = document.createElement(element);
    Object.entries(otherProps).forEach(([key, value]) => {
      newElement.setAttribute(key, value);
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
        childComponent.parentNode = newElement;
        childComponents.push(childComponent);

        // our state tracker added that
        // if (childComponent._addUnmountHandler) {
        //   // add them to an array
        //   // add that array to the output
        //   // when we use `_triggerUpdates`,
        //   // call `unmount` handlers recursively

        //   delete childComponent._addUnmountHandler;
        // }
      }
    });

    return { html: newElement, velesNode: true, childComponents };

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
