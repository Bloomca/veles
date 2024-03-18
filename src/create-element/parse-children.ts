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
        htmlElement.appendChild(text);
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesNode" in childComponent &&
        childComponent?.velesNode
      ) {
        // TODO: check that it is a valid DOM Node
        htmlElement.appendChild(childComponent.html);
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
          htmlElement.appendChild(velesElementNode.html);
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
