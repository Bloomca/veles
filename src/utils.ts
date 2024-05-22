import type { VelesComponent, VelesElement, VelesStringElement } from "./types";

function getComponentVelesNode(component: VelesComponent | VelesElement): {
  velesElementNode: VelesElement | VelesStringElement;
  componentsTree: VelesComponent[];
} {
  const componentsTree: VelesComponent[] = [];
  let childNode: VelesComponent | VelesElement = component;
  // we can have multiple components nested, we need to get
  // to the actual HTML to attach it
  while ("velesComponent" in childNode) {
    componentsTree.push(childNode);
    if ("velesStringElement" in childNode.tree) {
      return {
        velesElementNode: childNode.tree,
        componentsTree,
      };
    } else {
      childNode = childNode.tree;
    }
  }

  return { velesElementNode: childNode, componentsTree };
}

function identity<T>(value1: T, value2: T) {
  return value1 === value2;
}

export { getComponentVelesNode, identity };
