import {
  callMountHandlers,
  callUnmountHandlers,
  renderTree,
  getExecutedComponentVelesNode,
} from "../_utils";
import { createTextElement } from "../create-element/create-text-element";
import { addPublicContext, popPublicContext } from "../context";

import type {
  ExecutedVelesElement,
  ExecutedVelesStringElement,
} from "../types";
import type { TrackingSelectorElement, StateTrackers } from "./types";

function updateUseValueSelector<T>({
  value,
  selectorTrackingElement,
  newTrackingSelectorElements,
  trackers,
  getValue,
}: {
  value: T;
  selectorTrackingElement: TrackingSelectorElement;
  newTrackingSelectorElements: TrackingSelectorElement[];
  trackers: StateTrackers;
  getValue: () => T;
}) {
  const { selectedValue, selector, cb, node, comparator, savedContext } =
    selectorTrackingElement;
  const newSelectedValue = selector ? selector(value) : value;

  if (comparator(selectedValue, newSelectedValue)) {
    /**
     * if there is no need for update, we push the existing element
     * to the new array. once we merge all subscriptions, we run
     * `unique` function which will make sure there are no double
     * subscriptions.
     *
     * This is needed because using `map` can potentially create
     * some weird side effects, since in case the node changed,
     * some elements will be dynamically removed from the array
     */

    newTrackingSelectorElements.push(selectorTrackingElement);
    return;
  }

  // we need to re-execute the rendering callback with the same
  // context values as before
  addPublicContext(savedContext);
  const returnednewNode = cb
    ? cb(newSelectedValue)
    : newSelectedValue == undefined
    ? ""
    : String(newSelectedValue);
  const newNode =
    !returnednewNode || typeof returnednewNode === "string"
      ? createTextElement(returnednewNode as string)
      : returnednewNode;

  // Since we render a new Node, we need to insert it into the DOM
  // manually and immediately. So we render the full HTML tree.
  const newRenderedNode = renderTree(newNode);
  // this should remove our saved context value from the stack
  // so that other components will be executed within their own context
  popPublicContext();
  newNode.executedVersion = newRenderedNode;

  // `executedVersion` is added when we convert it to tree. It doesn't have
  // to be mounted, but mounting happens right after.
  // If there is no this property, it means that it was not mounted, and
  // somehow the subscription was added
  if (!node.executedVersion) {
    console.error("the node was not mounted");
    return;
  }

  const oldVelesElementNode = getExecutedComponentVelesNode(
    node.executedVersion
  );
  const newVelesElementNode = getExecutedComponentVelesNode(newRenderedNode);

  const parentVelesElement = node.parentVelesElement;
  const parentVelesElementRendered = oldVelesElementNode.parentVelesElement;

  // at this point we can construct the new tracking selector element
  // the old will be removed by the unmount lifecycle hook from the node
  const newTrackingSelectorElement: TrackingSelectorElement = {
    selector,
    selectedValue: newSelectedValue,
    cb,
    node: newNode,
    comparator,
    savedContext,
  };

  if (parentVelesElementRendered) {
    newNode.parentVelesElement = parentVelesElement;
    newVelesElementNode.parentVelesElement = parentVelesElementRendered;
    // we need to treat phantom nodes slightly differently
    // because it is not a single node removal/insert, but all
    // the children at once
    if (
      "executedVelesNode" in newVelesElementNode &&
      newVelesElementNode.phantom
    ) {
      const insertAllPhantomChildren = (
        adjacentNode: ExecutedVelesElement | ExecutedVelesStringElement
      ) => {
        // we need to get ALL the children of it and attach it to this node
        newVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("executedVelesNode" in childComponentofPhantom) {
              adjacentNode.html.before(childComponentofPhantom.html);
              childComponentofPhantom.parentVelesElement =
                adjacentNode.parentVelesElement;
            } else {
              const velesElementNode = getExecutedComponentVelesNode(
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
      if (
        "executedVelesNode" in oldVelesElementNode &&
        oldVelesElementNode.phantom
      ) {
        let isInserted = false;
        oldVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("executedVelesNode" in childComponentofPhantom) {
              if (!isInserted) {
                insertAllPhantomChildren(childComponentofPhantom);
                isInserted = true;
              }
              childComponentofPhantom.html.remove();
            } else {
              const velesElementNode = getExecutedComponentVelesNode(
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
      if (
        "executedVelesNode" in oldVelesElementNode &&
        oldVelesElementNode.phantom
      ) {
        let isInserted = false;
        oldVelesElementNode.childComponents.forEach(
          (childComponentofPhantom) => {
            if ("executedVelesNode" in childComponentofPhantom) {
              if (!isInserted) {
                childComponentofPhantom.html.before(newVelesElementNode.html);
                isInserted = true;
              }
              childComponentofPhantom.html.remove();
            } else {
              const velesElementNode = getExecutedComponentVelesNode(
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
        try {
          if (parentVelesElementRendered.portal) {
            parentVelesElementRendered.portal.replaceChild(
              newVelesElementNode.html,
              oldVelesElementNode.html
            );
          } else {
            parentVelesElementRendered.html.replaceChild(
              newVelesElementNode.html,
              oldVelesElementNode.html
            );
          }
        } catch (e) {
          console.error("failed to update...");
          console.log(document.body.innerHTML);
          console.log(oldVelesElementNode.parentVelesElement.html.innerHTML);
          console.log(
            //@ts-expect-error
            oldVelesElementNode.parentVelesElement.childComponents[0].html
              .textContent
          );
        }
      }
    }

    // we need to update `childComponents` so that after the update
    // if the parent node is removed from DOM, it calls correct unmount
    // callbacks
    parentVelesElementRendered.childComponents =
      parentVelesElementRendered.childComponents.map((childComponent) =>
        childComponent === node.executedVersion
          ? newRenderedNode
          : childComponent
      );

    if (parentVelesElement?.childComponents) {
      parentVelesElement.childComponents =
        parentVelesElement.childComponents.map((childComponent) =>
          childComponent === node ? newNode : childComponent
        );
    }

    // we call unmount handlers right after we replace it
    // this is where the old
    callUnmountHandlers(node.executedVersion);

    addUseValueMountHandler({
      usedValue: value,
      trackers,
      getValue,
      trackingSelectorElement: newTrackingSelectorElement,
    });
    // at this point the new Node is mounted, childComponents are updated
    // old tracking selector element will be removed in the `unmount` handler
    callMountHandlers(newRenderedNode);

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

function addUseValueMountHandler<T>({
  usedValue,
  getValue,
  trackers,
  trackingSelectorElement,
}: {
  usedValue: T;
  getValue(): T;
  trackers: StateTrackers;
  trackingSelectorElement: TrackingSelectorElement;
}) {
  trackingSelectorElement.node._privateMethods._addMountHandler(() => {
    const currentValue = getValue();

    // if the current value is the same as the one which was used to calculate
    // current node, nothing really changed, no need to run it again
    if (usedValue === currentValue) {
      trackers.trackingSelectorElements.push(trackingSelectorElement);
      trackingSelectorElement.node._privateMethods._addUnmountHandler(() => {
        trackers.trackingSelectorElements =
          trackers.trackingSelectorElements.filter(
            (el) => trackingSelectorElement !== el
          );
      });
    } else {
      const newTrackingSelectorElements: TrackingSelectorElement[] = [];
      updateUseValueSelector({
        value: getValue(),
        trackers,
        selectorTrackingElement: trackingSelectorElement,
        newTrackingSelectorElements,
        getValue,
      });

      if (newTrackingSelectorElements[0]) {
        const newTrackingSelectorElement = newTrackingSelectorElements[0];
        // this means nothing really changed
        if (newTrackingSelectorElement.node === trackingSelectorElement.node) {
          trackers.trackingSelectorElements.push(newTrackingSelectorElement);
          newTrackingSelectorElement.node._privateMethods._addUnmountHandler(
            () => {
              trackers.trackingSelectorElements =
                trackers.trackingSelectorElements.filter(
                  (el) => trackingSelectorElement !== el
                );
            }
          );
        } else {
          // otherwise it means the node was replaced, because the selector result is different
          // the new node will be executed with this function as well, so nothing to do here
        }
      } else {
        // should not happen, as nothing happens only when there is no parent element
        // since we are in the `onMount` handler, it means everything is mounted
      }
    }
  });
}

export { updateUseValueSelector, addUseValueMountHandler };
