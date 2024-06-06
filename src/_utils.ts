import type { VelesComponent, VelesElement, VelesStringElement } from "./types";

function getComponentVelesNode(
  component: VelesComponent | VelesElement | VelesStringElement
): {
  velesElementNode: VelesElement | VelesStringElement;
  componentsTree: VelesComponent[];
} {
  const componentsTree: VelesComponent[] = [];

  if ("velesStringElement" in component) {
    return {
      velesElementNode: component,
      componentsTree: [],
    };
  }

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

function callMountHandlers(
  component: VelesComponent | VelesElement | VelesStringElement
): void {
  if ("velesStringElement" in component) {
    // string elements don't have mount callbacks, only unmount
    return;
  }

  if ("velesComponent" in component) {
    component._privateMethods._callMountHandlers();
    callMountHandlers(component.tree);
  }

  if ("velesNode" in component) {
    component.childComponents.forEach((childComponent) =>
      callMountHandlers(childComponent)
    );
  }
}

function identity<T>(value1: T, value2: T) {
  return value1 === value2;
}

// return an array with elements being there only one time total
// the first encountered value will be preserved
function unique<T>(arr: T[]): T[] {
  const map = new Map<T, true>();
  const resultArr: T[] = [];
  arr.forEach((element) => {
    if (map.has(element)) return;

    map.set(element, true);
    resultArr.push(element);
  });

  return resultArr;
}

export { getComponentVelesNode, identity, callMountHandlers, unique };
