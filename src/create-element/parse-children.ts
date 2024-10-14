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
  portal,
}: {
  children: VelesElementProps["children"];
  htmlElement: HTMLElement;
  velesNode: VelesElement;
  portal?: HTMLElement;
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
        } else if (childComponent.portal) {
          // portal HTML is inserted in `mount` and `unmount` hooks, so we don't do it here
          // we still need to update the parent element so that iterating over the tree works
          // properly to call these callbacks
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
        childComponent.parentVelesElement = velesNode;
        childComponents.push(childComponent);
        // If the parent is a portal Node, we don't need to insert it. We also don't need to
        // maintain the order, since the insertion happens when it is mounted in children order
        // however, we need to add that code to the mount/unmount callbacks
        if (portal) {
          childComponent.portal = portal;
        } else {
          childComponent.insertAfter = lastInsertedNode;
          lastInsertedNode = childComponent;
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

        lastInsertedNode = childComponent.html;
      }
    }
  );

  return childComponents;
}

export { parseChildren };
