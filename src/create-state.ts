import type { VelesElement } from "./types";

function createState<T>(initialValue: T) {
  let value = initialValue;
  let trackingElements: {
    cb: (value: T) => VelesElement;
    node: VelesElement;
  }[] = [];
  let trackingSelectorElements: {
    cb: Function;
    node: VelesElement;
    selector: Function;
    selectedValue: any;
  }[] = [];

  let trackingAttributes: {
    cb: Function;
    htmlElement: HTMLElement;
    attributeName: string;
  }[] = [];

  const result = {
    initialValue,
    useValue: (cb: (value: T) => VelesElement) => {
      const node = cb(value);
      trackingElements.push({ cb, node });
      node._addUnmountHandler(() => {
        trackingElements = trackingElements.filter(
          (trackingElement) => trackingElement.cb !== cb
        );
      });

      return node;
    },
    useValueSelector<F>(
      selector: (value: T) => F,
      cb: (value: F) => VelesElement
    ) {
      const selectedValue = selector(value);
      const node = cb(selectedValue);
      trackingSelectorElements.push({ selector, selectedValue, cb, node });
      node._addUnmountHandler(() => {
        trackingSelectorElements = trackingSelectorElements.filter(
          (trackingSelectorElement) => trackingSelectorElement.cb !== cb
        );
      });
      return node;
    },
    useValueIterator: () => {
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

        node._addUnmountHandler(() => {
          trackingAttributes = trackingAttributes.filter(
            (trackingAttribute) => trackingAttribute.cb !== cb
          );
        });

        return attributeValue;
      };
      // we need to
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
    setValue: (newValueCB) => {
      const newValue = newValueCB(value);

      if (newValue !== value) {
        value = newValue;
        result._triggerUpdates();
      }
    },
    _triggerUpdates: () => {
      trackingElements = trackingElements.map(({ cb, node }) => {
        const newNode = cb(value);

        const parentVelesElement = node.parentVelesElement;

        if (parentVelesElement) {
          newNode.parentVelesElement = parentVelesElement;
          parentVelesElement.html.replaceChild(newNode.html, node.html);
          // we need to update `childComponents` so that after the update
          // if the parent node is removed from DOM, it calls correct unmount
          // callbacks
          parentVelesElement.childComponents =
            parentVelesElement.childComponents.map((childComponent) =>
              childComponent === node ? newNode : node
            );
          // we call unmount handlers right after we replace it
          node._callUnmountHandlers();

          // right after that, we add the callback back
          // the top level node is guaranteed to be rendered again (at least right now)
          // if there were children listening, they should be cleared
          // and added back into their respective unmount listeners if it is still viable
          trackingElements.push({ cb, node: newNode });
          newNode._addUnmountHandler(() => {
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
          const parentVelesElement = node.parentVelesElement;

          if (parentVelesElement) {
            newNode.parentVelesElement = parentVelesElement;
            parentVelesElement.html.replaceChild(node.html, newNode);
            // we need to update `childComponents` so that after the update
            // if the parent node is removed from DOM, it calls correct unmount
            // callbacks
            parentVelesElement.childComponents =
              parentVelesElement.childComponents.map((childComponent) =>
                childComponent === node ? newNode : node
              );
            // we call unmount handlers right after we replace it
            node._callUnmountHandlers();

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
            newNode._addUnmountHandler(() => {
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
    },
  };

  return result;
}

export { createState };
