import {
  callMountHandlers,
  renderTree,
  callUnmountHandlers,
  getExecutedComponentVelesNode,
} from "../_utils";
import { addPublicContext, popPublicContext } from "../context";

import type {
  ExecutedVelesComponent,
  ExecutedVelesElement,
  VelesComponentObject,
  VelesElement,
} from "../types";
import type {
  TrackingIterator,
  State,
  createState as createStateType,
} from "./types";

function updateUseValueIteratorValue<T>({
  value,
  trackingIterator,
  createState,
}: {
  value: T;
  trackingIterator: TrackingIterator;
  createState: typeof createStateType;
}) {
  const {
    cb,
    key,
    renderedElements,
    elementsByKey,
    wrapperComponent,
    selector,
    savedContext
  } = trackingIterator;
  if (!wrapperComponent) {
    console.error("there is no wrapper component for the iterator");
    return;
  }

  if (!wrapperComponent.executedVersion) {
    console.error("it seems the wrapper component was not mounted");
    return;
  }

  const wrapperVelesElementNode = getExecutedComponentVelesNode(
    wrapperComponent.executedVersion
  );
  const parentVelesElement = wrapperVelesElementNode.parentVelesElement;

  if (!parentVelesElement) {
    console.error("there is no parent Veles node for the iterator wrapper");
    return;
  }

  const elements = selector ? selector(value) : value;

  // if we have any tracking iterators, it means the value is an array
  // but I don't know how to have correct type inferring here
  // so we check manually
  if (Array.isArray(elements)) {
    const newRenderedElements: [
      VelesElement | VelesComponentObject,
      string,
      State<unknown>
    ][] = [];
    const newElementsByKey: {
      [key: string]: {
        elementState: State<unknown>;
        indexState: State<number>;
        indexValue: number;
        node: VelesElement | VelesComponentObject;
      };
    } = {};

    const renderedExistingElements: {
      [calculatedKey: string]: boolean;
    } = {};

    elements.forEach((element, index) => {      
      let calculatedKey: string = "";
      if (
        typeof key === "string" &&
        typeof element === "object" &&
        element !== null &&
        key in element
      ) {
        calculatedKey = element[key];
      } else if (typeof key === "function") {
        calculatedKey = key({ element, index });
      } else {
        // ignore for now
      }

      if (!calculatedKey) {
        return;
      }

      // first, we check if there is a node by this key
      // if there is, we do `getValue()` and compare whether the
      // item is the same.
      // if it is not, we need to do `elementState.setValue()`
      // with the new value
      // if the value is the same, nothing to do.
      //
      // after that, we need to put the new position down
      // (we'll reshuffle items at the end)
      //
      // if there is no node by this key, we need to:
      // 1. create a state for it
      // 2. create a node for it
      // 3. mark the new index for that node
      //
      // at the end, we need to find elements which were rendered, but are
      // not rendered anymore, and remove them from DOM and trigger `onUnmount`
      // for them.

      const existingElement = elementsByKey[calculatedKey];

      if (existingElement) {
        renderedExistingElements[calculatedKey] = true;
        const currentValue = existingElement.elementState.getValue();
        if (currentValue !== element) {
          existingElement.elementState.setValue(element);
        }
        const currentIndex = existingElement.indexState.getValue();
        if (currentIndex !== index) {
          existingElement.indexState.setValue(index);
        }

        newRenderedElements.push([
          existingElement.node,
          calculatedKey,
          existingElement.elementState,
        ]);
        newElementsByKey[calculatedKey] = {
          elementState: existingElement.elementState,
          indexState: existingElement.indexState,
          indexValue: index,
          node: existingElement.node,
        };
      } else {
        const elementState = createState(element);
        const indexState = createState(index);
        addPublicContext(savedContext)
        const node = cb({ elementState, indexState });
        // this TypeScript conversion should always be correct, because `node` is
        // also either a component or an element
        const renderedNode = renderTree(node) as
          | ExecutedVelesComponent
          | ExecutedVelesElement;
        node.executedVersion = renderedNode;
        popPublicContext()

        newRenderedElements.push([node, calculatedKey, elementState]);
        newElementsByKey[calculatedKey] = {
          elementState,
          indexState,
          indexValue: index,
          node,
        };
      }
    });

    // to replace old wrapper's children to make sure they are removed correctly
    // on `useValue` unmount
    const newChildRenderedComponents: (
      | ExecutedVelesComponent
      | ExecutedVelesElement
    )[] = [];
    const newChildComponents: (VelesComponentObject | VelesElement)[] = [];

    const positioningOffset: { [key: number]: number } = {};

    // to avoid iterating over arrays to determine whether there are removed nodes
    let newElementsCount: number = 0;
    // to avoid unnecessary shuffling of the DOM elements
    let offset: number = 0;
    let currentElement: HTMLElement | Text | null = null;
    newRenderedElements.forEach((newRenderedElement, index) => {
      newChildRenderedComponents.push(newRenderedElement[0].executedVersion);
      newChildComponents.push(newRenderedElement[0]);
      // if we needed to adjust offset until we reach the original position of the item
      // we need to return it back once we reach the position after it
      if (positioningOffset[index]) {
        offset = offset + positioningOffset[index];
      }

      const [newNode, calculatedKey, newState] = newRenderedElement;

      const existingElement = elementsByKey[calculatedKey];
      if (existingElement) {
        const existingElementNode = getExecutedComponentVelesNode(
          existingElement.node.executedVersion
        );
        // the element is in the same relative position
        if (existingElement.indexValue + offset === index) {
          currentElement = existingElementNode.html;
          return;
        }

        if (existingElement.indexValue + offset > index) {
          if (currentElement) {
            currentElement.after(existingElementNode.html);
            // we adjust the offset of the item right after the one
            // we repositioned
            positioningOffset[existingElement.indexValue + 1] = -1;
          } else {
            // this means we at position 0
            const firstRenderedElement = renderedElements[0]?.[0];
            if (firstRenderedElement?.executedVersion) {
              const firstRenderedVelesNode = getExecutedComponentVelesNode(
                firstRenderedElement.executedVersion as
                  | ExecutedVelesComponent
                  | ExecutedVelesElement
              );
              firstRenderedVelesNode.html.before(existingElementNode.html);
            } else {
              // TODO: handle this properly
            }
          }

          currentElement = existingElementNode.html;
          offset = offset + 1;
        } else {
          if (currentElement) {
            currentElement.after(existingElementNode.html);
            positioningOffset[existingElement.indexValue + 1] = 1;
          } else {
            // this means we at position 0
            const firstRenderedElement = renderedElements[0]?.[0];
            if (firstRenderedElement?.executedVersion) {
              const firstRenderedVelesNode = getExecutedComponentVelesNode(
                firstRenderedElement.executedVersion as
                  | ExecutedVelesComponent
                  | ExecutedVelesElement
              );
              firstRenderedVelesNode.html.before(existingElementNode.html);
            } else {
              // TODO: handle this properly
            }
          }

          currentElement = existingElementNode.html;
          offset = offset - 1;
        }
      } else {
        // we need to insert new element
        const newNodeVelesElement = getExecutedComponentVelesNode(
          newNode.executedVersion
        );
        newNodeVelesElement.parentVelesElement = parentVelesElement;

        if (currentElement) {
          currentElement.after(newNodeVelesElement.html);
        } else {
          // this basically means we at the position 0
          const firstRenderedElement = renderedElements[0]?.[0];
          if (firstRenderedElement?.executedVersion) {
            const firstRenderedVelesNode = getExecutedComponentVelesNode(
              firstRenderedElement.executedVersion as
                | ExecutedVelesComponent
                | ExecutedVelesElement
            );
            firstRenderedVelesNode.html.before(newNodeVelesElement.html);
          } else {
            // TODO: handle the case when there were 0 rendered elements
            // right now this thing assumes there were no
            parentVelesElement.html.prepend(newNodeVelesElement.html);
          }
        }

        offset = offset + 1;
        currentElement = newNodeVelesElement.html;
        newElementsCount = newElementsCount + 1;

        callMountHandlers(newNode.executedVersion);
      }
    });

    if (
      renderedElements.length ===
      newRenderedElements.length + newElementsCount
    ) {
      // it means no existing nodes were removed, so we don't need to do anything
    } else {
      // it means something was removed, and we need to remove it from
      // `childComponents` of our `wrapperComponent`, and also from the DOM
      renderedElements.forEach(([oldNode, calculatedKey]) => {
        // the element is still in DOM
        if (renderedExistingElements[calculatedKey] === true) {
          return;
        } else {
          const oldRenderedVelesNode = getExecutedComponentVelesNode(
            oldNode.executedVersion
          );

          oldRenderedVelesNode.html.remove();
          callUnmountHandlers(oldNode.executedVersion);

          if ("executedVelesNode" in wrapperVelesElementNode) {
            wrapperVelesElementNode.childComponents =
              wrapperVelesElementNode.childComponents.filter(
                (childComponent) => childComponent !== oldNode.executedVersion
              );
          } else {
            throw new Error("Wrapper iterator element is a string");
          }

          if ("velesNode" in wrapperComponent) {
            wrapperComponent.childComponents =
              wrapperComponent.childComponents.filter(
                (childComponent) => childComponent !== oldNode
              );
          }
        }
      });
    }

    // We need to update `childComponents` of `wrapperVelesElementNode` to have the latest info
    // otherwise it will not be removed completely if it needs to be unmounted.
    if ("executedVelesNode" in wrapperVelesElementNode) {
      wrapperVelesElementNode.childComponents = newChildRenderedComponents;
    }

    if ("velesNode" in wrapperComponent) {
      wrapperComponent.childComponents = newChildComponents;
    }

    // update the tracking info with new data
    trackingIterator.renderedElements = newRenderedElements;
    trackingIterator.elementsByKey = newElementsByKey;
  }
}

export { updateUseValueIteratorValue };
