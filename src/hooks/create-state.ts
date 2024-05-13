import { getComponentVelesNode } from "../utils";
import { onUnmount } from "./lifecycle";
import { createElement } from "../create-element/create-element";

import type { VelesElement, VelesComponent } from "../types";

type AttributeHelper = {
  (htmlElement: HTMLElement, attributeName: string, node: VelesElement): string;
  velesAttribute: boolean;
};

type State<ValueType> = {
  trackValue(cb: (value: ValueType) => void | Function): void;
  useValue(
    cb: (value: ValueType) => VelesElement | VelesComponent
  ): VelesElement | VelesComponent;
  useValueSelector<SelectorValueType>(
    selector: (value: ValueType) => SelectorValueType,
    cb: (value: SelectorValueType) => VelesElement | VelesComponent
  ): VelesElement | VelesComponent;
  useAttribute(cb: (value: ValueType) => string): AttributeHelper;
  useValueIterator<Element>(
    cb: (props: {
      elementState: State<Element>;
      index: number;
    }) => VelesElement | VelesComponent,
    options: {
      key: string | ((options: { element: Element; index: number }) => string);
    }
  ): VelesComponent | VelesElement;
  getValue(): ValueType;
  setValue(newValueCB: (currentValue: ValueType) => ValueType): void;

  // private method, don't use directly
  // TODO: hide completely in a closure
  _triggerUpdates(): void;
};

type TrackingParams = {
  cb: (props: {
    elementState: State<any>;
    index: number;
  }) => VelesElement | VelesComponent;
  renderedElements: [VelesElement | VelesComponent, string, State<unknown>][];
  key: string | ((options: { element: unknown; index: number }) => string);
  elementsByKey: {
    [key: string]: {
      elementState: State<unknown>;
      index: number;
      node: VelesElement | VelesComponent;
    };
  };
  wrapperComponent: VelesElement | VelesComponent;
};

function createState<T>(
  initialValue: T,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"]
  ) => Function
): State<T> {
  let value = initialValue;
  let trackingEffects: { (value: T): void }[] = [];
  let trackingElements: {
    cb: (value: T) => VelesElement | VelesComponent;
    node: VelesElement | VelesComponent;
  }[] = [];
  let trackingSelectorElements: {
    cb: (value: any) => VelesElement | VelesComponent;
    node: VelesElement | VelesComponent;
    selector: Function;
    selectedValue: any;
  }[] = [];

  let trackingAttributes: {
    cb: Function;
    htmlElement: HTMLElement;
    attributeName: string;
  }[] = [];

  let trackingIterators: TrackingParams[] = [];

  const result: State<T> = {
    // supposed to be used at the component level
    // TODO: add a version of trackValueSelector
    trackValue: (cb) => {
      trackingEffects.push(cb);
      // trigger the callback first time
      // maybe provide an option to skip it first time?
      cb(value);
      // track value is attached at the component level
      onUnmount(() => {
        trackingEffects = trackingEffects.filter(
          (trackingCallback) => trackingCallback !== cb
        );
      });
    },
    useValue: (cb) => {
      const node = cb(value);
      trackingElements.push({ cb, node });
      node._privateMethods._addUnmountHandler(() => {
        trackingElements = trackingElements.filter(
          (trackingElement) => trackingElement.cb !== cb
        );
      });

      return node;
    },
    useValueSelector<F>(
      selector: (value: T) => F,
      cb: (value: F) => VelesElement | VelesComponent
    ): VelesElement | VelesComponent {
      const selectedValue = selector(value);
      const node = cb(selectedValue);
      trackingSelectorElements.push({ selector, selectedValue, cb, node });
      node._privateMethods._addUnmountHandler(() => {
        trackingSelectorElements = trackingSelectorElements.filter(
          (trackingSelectorElement) => trackingSelectorElement.cb !== cb
        );
      });
      return node;
    },
    // TODO: add a version with a selector
    useValueIterator<Element>(
      cb: (props: {
        elementState: State<Element>;
        index: number;
      }) => VelesElement | VelesComponent,
      options: {
        key: string | ((options: { element: any; index: number }) => string);
      }
    ) {
      const children: [
        VelesElement | VelesComponent,
        string,
        State<Element>
      ][] = [];
      const elementsByKey: {
        [key: string]: {
          elementState: State<Element>;
          index: number;
          node: VelesElement | VelesComponent;
        };
      } = {};

      (value as Element[]).forEach((element, index) => {
        // we calculate a key for each element. This key determines whether we render the element from scratch, or do nothing
        // when the element updates
        let calculatedKey: string = "";
        if (
          typeof options.key === "string" &&
          typeof element === "object" &&
          element !== null &&
          options.key in element
        ) {
          calculatedKey = element[options.key];
        } else if (typeof options.key === "function") {
          calculatedKey = options.key({ element, index });
        } else {
          // ignore for now
        }

        const elementState = createState(element);

        if (!calculatedKey) {
          return;
        }

        const node = cb({ elementState, index });

        elementsByKey[calculatedKey] = {
          node,
          index,
          elementState,
        };

        children.push([node, calculatedKey, elementState]);
      });

      const trackingParams = {} as TrackingParams;
      trackingIterators.push(trackingParams);

      const wrapperComponent = createElement(() => {
        onUnmount(() => {
          trackingIterators = trackingIterators.filter(
            (currentTrackingParams) => currentTrackingParams !== trackingParams
          );
        });
        return createElement("div", {
          phantom: true,
          children: children.map((child) => child[0]),
        });
      });

      trackingParams.cb = cb;
      trackingParams.key = options.key;
      trackingParams.elementsByKey = elementsByKey;
      trackingParams.renderedElements = children;
      trackingParams.wrapperComponent = wrapperComponent;

      return wrapperComponent;

      // 1. build a lookup table with existing values
      // 2. build a lookup table with positions
      // 3. if there is a new value, update lookup tables
      //    and insert the new component in the right place
      // 4. provide a way to listen to position value.
      //    It should be a separate subscription.
    },
    useAttribute: (cb: (value: T) => string) => {
      const attributeValue = cb(value);

      const attributeHelper = (
        htmlElement: HTMLElement,
        attributeName: string,
        node: VelesElement
      ) => {
        // save it to the attribute array
        // read that array on `_triggerUpdates`
        // and change inline
        // we need to save the HTML element and the name of the attribute

        trackingAttributes.push({ cb, htmlElement, attributeName });

        node._privateMethods._addUnmountHandler(() => {
          trackingAttributes = trackingAttributes.filter(
            (trackingAttribute) => trackingAttribute.cb !== cb
          );
        });

        return attributeValue;
      };
      attributeHelper.velesAttribute = true;

      return attributeHelper;
    },
    // useful for stuff like callbacks
    getValue: () => {
      return value;
    },
    // set up new value only through the callback which
    // gives the latest value to ensure no outdated data
    // can be used for the state
    setValue: (newValueCB: (currentValue: T) => T): void => {
      const newValue = newValueCB(value);

      if (newValue !== value) {
        value = newValue;
        result._triggerUpdates();
      }
    },
    _triggerUpdates: () => {
      trackingElements = trackingElements.map(({ cb, node }) => {
        const newNode = cb(value);

        const { velesElementNode: oldVelesElementNode } =
          getComponentVelesNode(node);
        const { velesElementNode: newVelesElementNode } =
          getComponentVelesNode(newNode);

        const parentVelesElement = oldVelesElementNode.parentVelesElement;

        if (parentVelesElement) {
          newVelesElementNode.parentVelesElement = parentVelesElement;
          parentVelesElement.html.replaceChild(
            newVelesElementNode.html,
            oldVelesElementNode.html
          );
          // we need to update `childComponents` so that after the update
          // if the parent node is removed from DOM, it calls correct unmount
          // callbacks
          parentVelesElement.childComponents =
            parentVelesElement.childComponents.map((childComponent) =>
              childComponent === node ? newNode : node
            );
          // we call unmount handlers right after we replace it
          node._privateMethods._callUnmountHandlers();

          // right after that, we add the callback back
          // the top level node is guaranteed to be rendered again (at least right now)
          // if there were children listening, they should be cleared
          // and added back into their respective unmount listeners if it is still viable
          trackingElements.push({ cb, node: newNode });
          newNode._privateMethods._addUnmountHandler(() => {
            trackingElements = trackingElements.filter(
              (trackingElement) => trackingElement.cb !== cb
            );
          });
        } else {
          console.log("parent node was not found");
        }

        return { cb, node: newNode };
      });

      trackingSelectorElements = trackingSelectorElements.map(
        (selectorTrackingElement) => {
          const { selectedValue, selector, cb, node } = selectorTrackingElement;
          const newSelectedValue = selector(value);

          if (selectedValue === newSelectedValue) {
            return selectorTrackingElement;
          }

          const newNode = cb(newSelectedValue);

          const { velesElementNode: oldVelesElementNode } =
            getComponentVelesNode(node);
          const { velesElementNode: newVelesElementNode } =
            getComponentVelesNode(newNode);

          const parentVelesElement = oldVelesElementNode.parentVelesElement;

          if (parentVelesElement) {
            newVelesElementNode.parentVelesElement = parentVelesElement;
            parentVelesElement.html.replaceChild(
              newVelesElementNode.html,
              oldVelesElementNode.html
            );
            // we need to update `childComponents` so that after the update
            // if the parent node is removed from DOM, it calls correct unmount
            // callbacks
            parentVelesElement.childComponents =
              parentVelesElement.childComponents.map((childComponent) =>
                childComponent === node ? newNode : node
              );
            // we call unmount handlers right after we replace it
            node._privateMethods._callUnmountHandlers();

            // right after that, we add the callback back
            // the top level node is guaranteed to be rendered again (at least right now)
            // if there were children listening, they should be cleared
            // and added back into their respective unmount listeners if it is still viable
            trackingSelectorElements.push({
              selector,
              selectedValue: newSelectedValue,
              cb,
              node: newNode,
            });
            newNode._privateMethods._addUnmountHandler(() => {
              trackingSelectorElements = trackingSelectorElements.filter(
                (trackingSelectorElement) => trackingSelectorElement.cb !== cb
              );
            });
          } else {
            console.log("parent node was not found");
          }

          return {
            selectedValue: newSelectedValue,
            selector,
            cb,
            node: newNode,
          };
        }
      );

      // attributes
      // the HTML node does not change, so we don't need to modify the array
      trackingAttributes.forEach(({ cb, htmlElement, attributeName }) => {
        const newAttributeValue = cb(value);

        htmlElement.setAttribute(attributeName, newAttributeValue);
      });

      // tracked values
      trackingEffects.forEach((trackingCallback) => {
        trackingCallback(value);
      });

      trackingIterators.forEach((trackingIterator) => {
        const { cb, key, renderedElements, elementsByKey, wrapperComponent } =
          trackingIterator;
        if (!wrapperComponent) {
          console.error("there is no wrapper component for the iterator");
          return;
        }

        const { velesElementNode: wrapperVelesElementNode } =
          getComponentVelesNode(wrapperComponent);
        const parentVelesElement = wrapperVelesElementNode.parentVelesElement;

        if (!parentVelesElement) {
          console.error(
            "there is no parent Veles node for the iterator wrapper"
          );
          return;
        }

        // if we have any tracking iterators, it means the value is an array
        // but I don't know how to have correct type inferring here
        // so we check manually
        if (Array.isArray(value)) {
          const newRenderedElements: [
            VelesElement | VelesComponent,
            string,
            State<unknown>
          ][] = [];
          const newElementsByKey: {
            [key: string]: {
              elementState: State<unknown>;
              index: number;
              node: VelesElement | VelesComponent;
            };
          } = {};

          const renderedExistingElements: {
            [calculatedKey: string]: boolean;
          } = {};

          value.forEach((element, index) => {
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

            const existingElement = elementsByKey[calculatedKey];

            if (existingElement) {
              renderedExistingElements[calculatedKey] = true;
              const currentValue = existingElement.elementState.getValue();
              if (currentValue !== element) {
                existingElement.elementState.setValue(() => element);
              }

              newRenderedElements.push([
                existingElement.node,
                calculatedKey,
                existingElement.elementState,
              ]);
              newElementsByKey[calculatedKey] = {
                elementState: existingElement.elementState,
                index,
                node: existingElement.node,
              };
            } else {
              const elementState = createState(element);
              const node = cb({ elementState, index });

              newRenderedElements.push([node, calculatedKey, elementState]);
              newElementsByKey[calculatedKey] = {
                elementState,
                index,
                node,
              };
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
          });

          const positioningOffset: { [key: number]: number } = {};

          // to avoid iterating over arrays to determine whether there are removed nodes
          let newElementsCount: number = 0;
          // to avoid unnecessary shuffling of the DOM elements
          let offset: number = 0;
          let currentElement: HTMLElement | null = null;
          newRenderedElements.forEach((newRenderedElement, index) => {
            // if we needed to adjust offset until we reach the original position of the item
            // we need to return it back once we reach the position after it
            if (positioningOffset[index]) {
              offset = offset + positioningOffset[index];
            }

            const [newNode, calculatedKey, newState] = newRenderedElement;

            const existingElement = elementsByKey[calculatedKey];
            if (existingElement) {
              const { velesElementNode: existingElementNode } =
                getComponentVelesNode(existingElement.node);
              // the element is in the same relative position
              if (existingElement.index + offset === index) {
                currentElement = existingElementNode.html;
                return;
              }

              if (existingElement.index + offset > index) {
                if (currentElement) {
                  currentElement.after(existingElementNode.html);
                  // we adjust the offset of the item right after the one
                  // we repositioned
                  positioningOffset[existingElement.index + 1] = -1;
                } else {
                  // this means we at position 0
                  const firstRenderedElement = renderedElements[0]?.[0];
                  if (firstRenderedElement) {
                    const { velesElementNode: firstRenderedVelesNode } =
                      getComponentVelesNode(firstRenderedElement);
                    firstRenderedVelesNode.html.before(
                      existingElementNode.html
                    );
                  } else {
                    // TODO: handle this properly
                  }
                }

                currentElement = existingElementNode.html;
                offset = offset + 1;
              } else {
                if (currentElement) {
                  currentElement.after(existingElementNode.html);
                  positioningOffset[existingElement.index + 1] = 1;
                } else {
                  // this means we at position 0
                  const firstRenderedElement = renderedElements[0]?.[0];
                  if (firstRenderedElement) {
                    const { velesElementNode: firstRenderedVelesNode } =
                      getComponentVelesNode(firstRenderedElement);
                    firstRenderedVelesNode.html.before(
                      existingElementNode.html
                    );
                  } else {
                    // TODO: handle this properly
                  }
                }

                currentElement = existingElementNode.html;
                offset = offset - 1;
              }
            } else {
              // we need to insert new element
              const { velesElementNode: newNodeVelesElement } =
                getComponentVelesNode(newNode);
              newNodeVelesElement.parentVelesElement = parentVelesElement;

              if (currentElement) {
                currentElement.after(newNodeVelesElement.html);
              } else {
                // this basically means we at the position 0
                const firstRenderedElement = renderedElements[0]?.[0];
                if (firstRenderedElement) {
                  const { velesElementNode: firstRenderedVelesNode } =
                    getComponentVelesNode(firstRenderedElement);
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
                const { velesElementNode: oldRenderedVelesNode } =
                  getComponentVelesNode(oldNode);

                oldRenderedVelesNode.html.remove();
                oldNode._privateMethods._callUnmountHandlers();

                wrapperVelesElementNode.childComponents =
                  wrapperVelesElementNode.childComponents.filter(
                    (childComponent) => childComponent !== oldNode
                  );
              }
            });
          }

          // update the tracking info with new data
          trackingIterator.renderedElements = newRenderedElements;
          trackingIterator.elementsByKey = newElementsByKey;
        }
      });
    },
  };

  if (subscribeCallback) {
    const unsubscribe = subscribeCallback(result.setValue);

    if (unsubscribe) {
      onUnmount(unsubscribe);
    }
  }

  return result;
}

export { createState };
