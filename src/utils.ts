import type { VelesComponent, VelesElement } from "./types";

function getComponentVelesNode(component: VelesComponent | VelesElement): {
  velesElementNode: VelesElement;
  componentsTree: VelesComponent[];
} {
  const componentsTree: VelesComponent[] = [];
  let childNode: VelesComponent | VelesElement = component;
  // we can have multiple components nested, we need to get
  // to the actual HTML to attach it
  while ("velesComponent" in childNode) {
    componentsTree.push(childNode);
    childNode = childNode.tree;
  }

  return { velesElementNode: childNode, componentsTree };
}

export { getComponentVelesNode };
