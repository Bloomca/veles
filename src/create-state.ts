import type { VelesElement } from "./types";

function createState<T>(initialValue: T) {
  let value = initialValue;
  let trackingElements: { cb: Function; node: VelesElement }[] = [];
  let trackingSelectorElements: {
    cb: Function;
    node: VelesElement;
    selector: Function;
    selectedValue: any;
  }[] = [];

  const result = {
    initialValue,
    useValue: (cb) => {
      const node = cb(value);
      trackingElements.push({ cb, node });
      // TODO: not implemented yet
      // node._addUnmountHandler(() => {
      //   trackingElements = trackingElements.filter(
      //     (trackingElement) => trackingElement.cb !== cb
      //   );
      // });

      return node;
    },
    useValueSelector: (selector, cb) => {
      const selectedValue = selector(value);
      const node = cb(selectedValue);
      trackingSelectorElements.push({ selector, selectedValue, cb, node });
      // TODO: not implemented yet
      // node._addUnmountHandler(() => {
      //   trackingElements = trackingElements.filter(
      //     (trackingElement) => trackingElement.cb !== cb
      //   );
      // });
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
    useAttribute: () => {
      // change attributes in-place
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

        const parentNode = node.parentNode;

        if (parentNode) {
          newNode.parentNode = parentNode;
          parentNode.replaceChild(newNode.html, node.html);
        } else {
          console.log("parent node was not found");
        }

        // TODO: iterate over `node.childComponents` recursively, and execute
        // every `onUnmount` operation

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
          const parentNode = node.parentNode;

          if (parentNode) {
            parentNode.replaceChild(node.html, newNode);
          } else {
            console.log("parent node was not found");
          }

          // TODO: iterate over `node.childComponents` recursively, and execute
          // every `onUnmount` operation

          return {
            selectedValue: newSelectedValue,
            selector,
            cb,
            node: newNode,
          };
        }
      );
    },
  };

  return result;
}

export { createState };
