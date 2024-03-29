import { getComponentVelesNode } from "../utils";

import type { VelesComponent, VelesElement, VelesElementProps } from "../types";

function parseChildren({
  children,
  htmlElement,
  velesNode,
}: {
  children: VelesElementProps["children"];
  htmlElement: HTMLElement;
  velesNode: VelesElement;
}) {
  const childComponents: (VelesElement | VelesComponent)[] = [];

  if (children === undefined || children === null) {
    return childComponents;
  }

  (Array.isArray(children) ? children : [children]).forEach(
    (childComponent) => {
      if (typeof childComponent === "string") {
        const text = document.createTextNode(childComponent);
        htmlElement.append(text);
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesNode" in childComponent &&
        childComponent?.velesNode
      ) {
        if (childComponent.phantom) {
          // we need to get ALL the children of it and attach it to this node
          childComponent.childComponents.forEach((childComponentofPhantom) => {
            if ("velesNode" in childComponentofPhantom) {
              htmlElement.append(childComponentofPhantom.html);
              childComponentofPhantom.parentVelesElement = velesNode;
            } else {
              const { componentsTree, velesElementNode } =
                getComponentVelesNode(childComponentofPhantom);

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                htmlElement.append(velesElementNode.html);

                // TODO: address the same concern as below
                componentsTree.forEach((component) => {
                  component._privateMethods._callMountHandlers();
                });

                velesElementNode.parentVelesElement = velesNode;
              }
            }
          });
          childComponent.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        } else {
          // TODO: check that it is a valid DOM Node
          htmlElement.append(childComponent.html);
          childComponent.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        }
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
          if (velesElementNode.phantom) {
            // we need to get ALL the children of it and attach it to this node
            velesElementNode.childComponents.forEach(
              (childComponentofPhantom) => {
                if ("velesNode" in childComponentofPhantom) {
                  htmlElement.append(childComponentofPhantom.html);
                  childComponentofPhantom.parentVelesElement = velesNode;
                } else {
                  const { componentsTree, velesElementNode } =
                    getComponentVelesNode(childComponentofPhantom);

                  if (!velesElementNode) {
                    console.error("can't find HTML tree in a component chain");
                  } else {
                    htmlElement.append(velesElementNode.html);

                    // TODO: address the same concern as below
                    componentsTree.forEach((component) => {
                      component._privateMethods._callMountHandlers();
                    });

                    velesElementNode.parentVelesElement = velesNode;
                  }
                }
              }
            );
          } else {
            htmlElement.append(velesElementNode.html);
          }

          /**
           * TODO: rethink this
           * this is not 100% correct. the mount process here is that
           * it attaches the child component to the parent HTML component
           * the thing is, the process is recursive and goes up, not down,
           * so it ends in the actual DOM only when all of them are executed.
           *
           * It is possible to put the callbacks into the queue and then execute
           * it in the opposite order when the context stack is empty, which would
           * mean we process all components, but that approach would complicate
           * adding async rendering in the future.
           */
          componentsTree.forEach((component) => {
            component._privateMethods._callMountHandlers();
          });

          velesElementNode.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        }
      }
    }
  );

  return childComponents;
}

export { parseChildren };
