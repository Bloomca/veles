import { parseChildren } from "./parse-children";
import { assignAttributes } from "./assign-attributes";
import { parseComponent } from "./parse-component";
import { getExecutedComponentVelesNode } from "../_utils";

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
    const {
      children,
      ref,
      phantom = false,
      portal = null,
      ...otherProps
    } = props;

    const newElement = document.createElement(element);
    const velesNode = {} as VelesElement;

    if (ref?.velesRef) {
      ref.current = newElement;
    }

    const childComponents = parseChildren({
      children,
      htmlElement: newElement,
      velesNode,
      portal,
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
    velesNode.portal = portal;

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

    /**
     * Since portal node is already mounted in DOM, we can't just attach our HTML to it
     * imediately. So we attach it only when the component is actually mounted, and detach
     * when it is unmounted. This way we don't need to iterate the tree manually and
     * attach/detach in every case we need to change the tree.
     */
    if (portal) {
      velesNode._privateMethods._addMountHandler(function attachNodeOnMount() {
        velesNode.childComponents.forEach((childComponent) => {
          if ("velesNode" in childComponent) {
            portal.append(childComponent.html);

            // TODO: handle phantom nodes as content
          } else if ("velesStringElement" in childComponent) {
            portal.append(childComponent.html);
          } else {
            const componentNode = getExecutedComponentVelesNode(
              childComponent.executedVersion
            );
            childComponent.html = componentNode.html;
            portal.append(componentNode.html);

            // TODO: handle phantom nodes as content
          }
        });
      });

      velesNode._privateMethods._addUnmountHandler(
        function removeNodeOnUnmount() {
          velesNode.childComponents.forEach((childComponent) => {
            if ("velesNode" in childComponent) {
              childComponent.html.remove();
            } else if ("velesStringElement" in childComponent) {
              childComponent.html.remove();
            } else {
              const componentNode = getExecutedComponentVelesNode(
                childComponent.executedVersion
              );
              componentNode.html.remove();
            }
          });
        }
      );
    }

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
