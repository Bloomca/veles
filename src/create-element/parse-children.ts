import { createTextElement } from "./create-text-element";

import type {
  VelesComponentObject,
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
    | VelesComponentObject
    | VelesStringElement
  )[] = [];

  if (children === undefined || children === null) {
    return childComponents;
  }
  // we need this reference so that Components will be inserted at the right position
  // when they are executed
  let lastInsertedNode: null | HTMLElement | Text | VelesComponentObject = null;

  (Array.isArray(children) ? children : [children]).forEach(
    (childComponent) => {
      if (typeof childComponent === "string") {
        const textNode = createTextElement(childComponent);
        htmlElement.append(textNode.html);
        lastInsertedNode = textNode.html;
        childComponents.push(textNode);
      } else if (typeof childComponent === "number") {
        const textNode = createTextElement(String(childComponent));
        htmlElement.append(textNode.html);
        lastInsertedNode = textNode.html;
        childComponents.push(textNode);
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
              lastInsertedNode = childComponentofPhantom.html;
            } else if ("velesStringElement" in childComponentofPhantom) {
              const velesElementNode = childComponentofPhantom;

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                htmlElement.append(velesElementNode.html);
                lastInsertedNode = velesElementNode.html;

                velesElementNode.parentVelesElement = velesNode;
              }
            } else {
              // not sure if we need to do something
            }
          });
          childComponent.parentVelesElement = velesNode;
          childComponents.push(childComponent);
        } else {
          // TODO: check that it is a valid DOM Node
          htmlElement.append(childComponent.html);
          childComponent.parentVelesElement = velesNode;
          childComponents.push(childComponent);
          lastInsertedNode = childComponent.html;
        }
      } else if (
        typeof childComponent === "object" &&
        childComponent &&
        "velesComponentObject" in childComponent
      ) {
        childComponent.insertAfter = lastInsertedNode;
        childComponent.parentVelesElement = velesNode;
        childComponents.push(childComponent);
        lastInsertedNode = childComponent;
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

        lastInsertedNode = childComponent.html;
      }
    }
  );

  return childComponents;
}

export { parseChildren };
