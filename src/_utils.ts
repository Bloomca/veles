import { executeComponent } from "./create-element/parse-component";
import { addPublicContext, popPublicContext } from "./context";

import type {
  VelesComponentObject,
  VelesElement,
  VelesStringElement,
  ExecutedVelesComponent,
  ExecutedVelesElement,
  ExecutedVelesStringElement,
} from "./types";

function getExecutedComponentVelesNode(
  component:
    | ExecutedVelesComponent
    | ExecutedVelesElement
    | ExecutedVelesStringElement
): ExecutedVelesElement | ExecutedVelesStringElement {
  if ("executedVelesStringElement" in component) {
    return component;
  }

  let childNode: ExecutedVelesComponent | ExecutedVelesElement = component;
  // we can have multiple components nested, we need to get
  // to the actual HTML to attach it
  while ("executedVelesComponent" in childNode) {
    if ("executedVelesStringElement" in childNode.tree) {
      return childNode.tree;
    } else {
      childNode = childNode.tree;
    }
  }

  return childNode;
}

// Transforms intermediate tree into proper tree which can be mounted. This step is required so that
// all components are executed at the right order (from top leaves to children)
function renderTree(
  component: VelesComponentObject | VelesElement | VelesStringElement,
  { parentVelesElement }: { parentVelesElement?: ExecutedVelesElement } = {}
): ExecutedVelesComponent | ExecutedVelesElement | ExecutedVelesStringElement {
  if ("velesStringElement" in component) {
    const executedString: ExecutedVelesStringElement = {
      executedVelesStringElement: true,
      _privateMethods: component._privateMethods,
      html: component.html,
      parentVelesElement,
    };
    if (component.needExecutedVersion) {
      component.executedVersion = executedString;
    }
    return executedString;
  } else if ("velesComponentObject" in component) {
    addPublicContext();
    const componentTree = executeComponent(component);
    const executedComponent = {} as ExecutedVelesComponent;
    executedComponent.executedVelesComponent = true;
    executedComponent.tree = renderTree(componentTree.tree);
    popPublicContext();
    executedComponent._privateMethods = {
      ...componentTree._privateMethods,
      _callMountHandlers: () => {
        component._privateMethods._callMountHandlers();
        componentTree._privateMethods._callMountHandlers();
      },
      _callUnmountHandlers: () => {
        component._privateMethods._callUnmountHandlers();
        componentTree._privateMethods._callUnmountHandlers();
      },
    };
    const newNode = getExecutedComponentVelesNode(executedComponent);
    // if there is a portal, we don't need to render directly
    // instead, we need to do so in the mount callback
    if (component.portal) {
      // it is handled by the portal parent element
    } else if (parentVelesElement) {
      if (component.insertAfter) {
        if ("velesComponentObject" in component.insertAfter) {
          const lastNode = insertNode({
            velesElement: newNode,
            adjacentNode: component.insertAfter.html,
            parentVelesElement,
          });
          component.html = lastNode;
        } else {
          const lastNode = insertNode({
            velesElement: newNode,
            adjacentNode: component.insertAfter,
            parentVelesElement,
          });
          component.html = lastNode;
        }
      } else {
        const lastNode = insertNode({
          velesElement: newNode,
          // it means we are inserting the first element
          adjacentNode: null,
          parentVelesElement,
        });
        component.html = lastNode;
      }

      newNode.parentVelesElement = parentVelesElement;
    }
    if (component.needExecutedVersion || component.portal) {
      component.executedVersion = executedComponent;
    }
    return executedComponent;
  } else if ("velesNode" in component) {
    const executedNode = {} as ExecutedVelesElement;
    executedNode.executedVelesNode = true;
    executedNode._privateMethods = component._privateMethods;
    executedNode.html = component.html;
    if (parentVelesElement) {
      executedNode.parentVelesElement = parentVelesElement;
    }
    if (component.phantom) {
      executedNode.phantom = component.phantom;
    }
    if (component.portal) {
      executedNode.portal = component.portal;
    }
    executedNode.childComponents = component.childComponents.map(
      (childComponent) =>
        renderTree(childComponent, { parentVelesElement: executedNode })
    );
    if (component.needExecutedVersion) {
      component.executedVersion = executedNode;
    }
    return executedNode;
  }
}

function insertNode({
  velesElement,
  adjacentNode,
  parentVelesElement,
}: {
  velesElement: ExecutedVelesElement | ExecutedVelesStringElement;
  adjacentNode: HTMLElement | Text | null;
  parentVelesElement: ExecutedVelesElement;
}) {
  // @ts-expect-error
  if (velesElement.phantom) {
    let lastInsertedNode: HTMLElement | Text | null = null;

    (velesElement as ExecutedVelesElement).childComponents.forEach(
      (childComponentofPhantom) => {
        if ("executedVelesNode" in childComponentofPhantom) {
          if (lastInsertedNode) {
            lastInsertedNode.after(childComponentofPhantom.html);
          } else {
            if (adjacentNode) {
              adjacentNode.after(childComponentofPhantom.html);
            } else {
              parentVelesElement.html.prepend(childComponentofPhantom.html);
            }
          }
          childComponentofPhantom.parentVelesElement = parentVelesElement;
          lastInsertedNode = childComponentofPhantom.html;
        } else if ("executedVelesStringElement" in childComponentofPhantom) {
          if (lastInsertedNode) {
            lastInsertedNode.after(childComponentofPhantom.html);
          } else {
            if (adjacentNode) {
              adjacentNode.after(childComponentofPhantom.html);
            } else {
              parentVelesElement.html.prepend(childComponentofPhantom.html);
            }
          }
          childComponentofPhantom.parentVelesElement = parentVelesElement;
          lastInsertedNode = childComponentofPhantom.html;
        } else {
          const executedNode = getExecutedComponentVelesNode(
            childComponentofPhantom
          );
          if (lastInsertedNode) {
            lastInsertedNode.after(executedNode.html);
          } else {
            if (adjacentNode) {
              adjacentNode.after(executedNode.html);
            } else {
              parentVelesElement.html.prepend(executedNode.html);
            }
          }
          executedNode.parentVelesElement = parentVelesElement;
          lastInsertedNode = executedNode.html;
        }
      }
    );
    velesElement.parentVelesElement = parentVelesElement;

    return lastInsertedNode;
  } else {
    if (adjacentNode) {
      adjacentNode.after(velesElement.html);
    } else {
      parentVelesElement.html.prepend(velesElement.html);
    }
    velesElement.parentVelesElement = parentVelesElement;

    return velesElement.html;
  }
}

function callMountHandlers(
  component:
    | ExecutedVelesComponent
    | ExecutedVelesElement
    | ExecutedVelesStringElement
): void {
  component._privateMethods._callMountHandlers();
  if ("executedVelesStringElement" in component) {
    return;
  }

  if ("executedVelesComponent" in component) {
    callMountHandlers(component.tree);
  }

  if ("executedVelesNode" in component) {
    component.childComponents.forEach((childComponent) =>
      callMountHandlers(childComponent)
    );
  }
}

function callUnmountHandlers(
  component:
    | ExecutedVelesComponent
    | ExecutedVelesElement
    | ExecutedVelesStringElement
): void {
  if ("executedVelesStringElement" in component) {
    // pass
  } else if ("executedVelesComponent" in component) {
    callUnmountHandlers(component.tree);
  } else if ("executedVelesNode" in component) {
    component.childComponents.forEach((childComponent) =>
      callUnmountHandlers(childComponent)
    );
  }

  component._privateMethods._callUnmountHandlers();
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

export {
  getExecutedComponentVelesNode,
  identity,
  callMountHandlers,
  callUnmountHandlers,
  unique,
  renderTree,
};
