import { getComponentVelesNode, callMountHandlers } from "../_utils";
import { createTextElement } from "../create-element/create-text-element";

import type { VelesElement, VelesStringElement } from "../types";
import type { TrackingSelectorElement, StateTrackers } from "./types";

function updateUseValueSelector<T>({
  value,
  selectorTrackingElement,
  newTrackingSelectorElements,
  trackers,
}: {
  value: T;
  selectorTrackingElement: TrackingSelectorElement;
  newTrackingSelectorElements: TrackingSelectorElement[];
  trackers: StateTrackers;
}) {
  const { selectedValue, selector, cb, node, comparator } =
    selectorTrackingElement;
  const newSelectedValue = selector ? selector(value) : value;

  if (comparator(selectedValue, newSelectedValue)) {
    newTrackingSelectorElements.push(selectorTrackingElement);
    return;
  }

  const returnednewNode = cb
    ? cb(newSelectedValue)
    : newSelectedValue == undefined
    ? ""
    : String(newSelectedValue);
  const newNode =
    !returnednewNode || typeof returnednewNode === "string"
      ? createTextElement(returnednewNode as string)
      : returnednewNode;

  const { velesElementNode: oldVelesElementNode } = getComponentVelesNode(node);
  const { velesElementNode: newVelesElementNode } =
    getComponentVelesNode(newNode);

  const parentVelesElement = oldVelesElementNode.parentVelesElement;

  const newTrackingSelectorElement = {
    selector,
    selectedValue: newSelectedValue,
    cb,
    node: newNode,
    comparator,
  };

  if (parentVelesElement) {
    newVelesElementNode.parentVelesElement = parentVelesElement;
    // we need to treat phantom nodes slightly differently
    // because it is not a single node removal/insert, but all
    // the children at once
    if ("velesNode" in newVelesElementNode && newVelesElementNode.phantom) {
      const insertAllPhantomChildren = (
        adjacentNode: VelesElement | VelesStringElement
      ) => {
        // we need to get ALL the children of it and attach it to this node
        newVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("velesNode" in childComponentofPhantom) {
              adjacentNode.html.before(childComponentofPhantom.html);
              childComponentofPhantom.parentVelesElement =
                adjacentNode.parentVelesElement;
            } else {
              const { velesElementNode } = getComponentVelesNode(
                childComponentofPhantom
              );

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                adjacentNode.html.before(velesElementNode.html);
                velesElementNode.parentVelesElement =
                  adjacentNode.parentVelesElement;
              }
            }
          }
        );
      };
      if ("velesNode" in oldVelesElementNode && oldVelesElementNode.phantom) {
        let isInserted = false;
        oldVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("velesNode" in childComponentofPhantom) {
              if (!isInserted) {
                insertAllPhantomChildren(childComponentofPhantom);
                isInserted = true;
              }
              childComponentofPhantom.html.remove();
            } else {
              const { velesElementNode } = getComponentVelesNode(
                childComponentofPhantom
              );

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                if (!isInserted) {
                  insertAllPhantomChildren(velesElementNode);
                  isInserted = true;
                }
                velesElementNode.html.remove();
              }
            }
          }
        );
      } else {
        insertAllPhantomChildren(oldVelesElementNode);
        oldVelesElementNode.html.remove();
      }
    } else {
      if ("velesNode" in oldVelesElementNode && oldVelesElementNode.phantom) {
        let isInserted = false;
        oldVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("velesNode" in childComponentofPhantom) {
              if (!isInserted) {
                childComponentofPhantom.html.before(newVelesElementNode.html);
                isInserted = true;
              }
              childComponentofPhantom.html.remove();
            } else {
              const { velesElementNode } = getComponentVelesNode(
                childComponentofPhantom
              );

              if (!velesElementNode) {
                console.error("can't find HTML tree in a component chain");
              } else {
                if (!isInserted) {
                  velesElementNode.html.before(newVelesElementNode.html);
                  isInserted = true;
                }
                velesElementNode.html.remove();
              }
            }
          }
        );
      } else {
        parentVelesElement.html.replaceChild(
          newVelesElementNode.html,
          oldVelesElementNode.html
        );
      }
    }

    // we need to update `childComponents` so that after the update
    // if the parent node is removed from DOM, it calls correct unmount
    // callbacks
    parentVelesElement.childComponents = parentVelesElement.childComponents.map(
      (childComponent) => (childComponent === node ? newNode : childComponent)
    );
    // we call unmount handlers right after we replace it
    node._privateMethods._callUnmountHandlers();
    // at this point the new Node is mounted, childComponents are updated
    // and unmount handlers for the old node are called
    callMountHandlers(newNode);

    // right after that, we add the callback back
    // the top level node is guaranteed to be rendered again (at least right now)
    // if there were children listening, they should be cleared
    // and added back into their respective unmount listeners if it is still viable
    newNode._privateMethods._addUnmountHandler(() => {
      trackers.trackingSelectorElements =
        trackers.trackingSelectorElements.filter(
          (el) => el !== newTrackingSelectorElement
        );
    });
  } else {
    console.log("parent node was not found");
  }

  newTrackingSelectorElements.push(newTrackingSelectorElement);
}

export { updateUseValueSelector };
