import { getComponentVelesNode } from "../utils";

import type {
  VelesComponent,
  VelesElement,
  VelesStringElement,
  VelesElementProps,
} from "../types";

function parseChildren({
  children,
  htmlElement,
  velesNode,
}: {
  children: VelesElementProps["children"];
  htmlElement: HTMLElement;
  velesNode: VelesElement;
}) {
  const childComponents: (
    | VelesElement
    | VelesComponent
    | VelesStringElement
  )[] = [];

  if (children === undefined || children === null) {
    return childComponents;
  }

  (Array.isArray(children) ? children : [children]).forEach(
    (childComponent) => {
      if (typeof childComponent === "string") {
        const text = document.createTextNode(childComponent);
        htmlElement.append(text);
      } else if (typeof childComponent === "number") {
        const text = document.createTextNode(String(childComponent));
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
              const { velesElementNode } = getComponentVelesNode(
                childComponentofPhantom
              );

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                htmlElement.append(velesElementNode.html);

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
          if ("velesNode" in velesElementNode && velesElementNode.phantom) {
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
                    velesElementNode.parentVelesElement = velesNode;
                  }
                }
              }
            );
          } else {
            htmlElement.append(velesElementNode.html);
          }

          velesElementNode.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        }
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesStringElement" in childComponent &&
        childComponent?.velesStringElement
      ) {
        // TODO: check that it is a valid DOM Node
        htmlElement.append(childComponent.html);
        childComponent.parentVelesElement = velesNode;
        childComponents.push(childComponent);
      }
    }
  );

  return childComponents;
}

export { parseChildren };
