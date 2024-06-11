import { identity } from "../_utils";
import { onUnmount, onMount } from "../hooks/lifecycle";
import { createElement } from "../create-element/create-element";
import { createTextElement } from "../create-element/create-text-element";
import { triggerUpdates } from "./trigger-updates";
import { addUseValueMountHandler } from "./update-usevalue-selector-value";
import { updateUseAttributeValue } from "./update-useattribute-value";
import { getCurrentContext } from "../context";

import type {
  VelesElement,
  VelesComponentObject,
  VelesStringElement,
} from "../types";

import type {
  State,
  TrackingIterator,
  StateTrackers,
  TrackingSelectorElement,
} from "./types";

function createState<T>(
  initialValue: T,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"]
  ) => Function
): State<T> {
  let value = initialValue;
  let previousValue: undefined | T = undefined;

  const trackers: StateTrackers = {
    trackingEffects: [],
    trackingSelectorElements: [],
    trackingAttributes: [],
    trackingIterators: [],
  };

  const result: State<T> = {
    // supposed to be used at the component level
    trackValue: (cb, options = {}) => {
      result.trackValueSelector<T>(undefined, cb, options);
    },
    trackValueSelector<F>(
      selector: ((value: T) => F) | undefined,
      cb: (value: F) => void | Function,
      options: {
        callOnMount?: boolean;
        skipFirstCall?: boolean;
        comparator?: (value1: F, value2: F) => boolean;
      } = {}
    ) {
      // @ts-expect-error
      const trackedValue = selector ? selector(value) : (value as F);
      trackers.trackingEffects.push({
        cb,
        selector,
        comparator: options.comparator,
        selectedValue: trackedValue,
      });
      if (!options.skipFirstCall) {
        // trigger the callback first time
        // execute the first callback when the component is mounted
        if (options.callOnMount) {
          onMount(() => {
            cb(trackedValue);
          });
        } else {
          cb(trackedValue);
        }
      }
      // track value is attached at the component level
      onUnmount(() => {
        trackers.trackingEffects = trackers.trackingEffects.filter(
          (trackingCallback) => trackingCallback.cb !== cb
        );
      });
    },
    useValue: (cb, comparator) => {
      return result.useValueSelector<T>(undefined, cb, comparator);
    },
    useValueSelector<F>(
      selector: ((value: T) => F) | undefined,
      cb?: (
        value: F
      ) => VelesElement | VelesComponentObject | string | undefined | null,
      comparator: (value1: F, value2: F) => boolean = identity
    ): VelesElement | VelesComponentObject | VelesStringElement {
      // @ts-expect-error
      const selectedValue = selector ? selector(value) : (value as F);
      const returnedNode = cb
        ? cb(selectedValue)
        : selectedValue == undefined
        ? ""
        : String(selectedValue);
      const node =
        !returnedNode || typeof returnedNode === "string"
          ? createTextElement(returnedNode as string)
          : returnedNode;

      const currentContext = getCurrentContext();

      node.needExecutedVersion = true;

      const trackingSelectorElement: TrackingSelectorElement = {
        selector,
        selectedValue,
        cb,
        node,
        comparator,
        savedContext: currentContext,
      };

      addUseValueMountHandler({
        usedValue: value,
        getValue: () => value,
        trackers,
        trackingSelectorElement,
      });

      return node;
    },
    useValueIterator<Element>(
      options: {
        key: string | ((options: { element: any; index: number }) => string);
        selector?: (value: T) => Element[];
      },
      cb: (props: {
        elementState: State<Element>;
        indexState: State<number>;
      }) => VelesElement | VelesComponentObject
    ) {
      const trackingParams = {} as TrackingIterator;

      const wrapperComponent = createElement((_props, componentAPI) => {
        const children: [
          VelesElement | VelesComponentObject,
          string,
          State<Element>
        ][] = [];
        const elementsByKey: {
          [key: string]: {
            elementState: State<Element>;
            indexState: State<number>;
            indexValue: number;
            node: VelesElement | VelesComponentObject;
          };
        } = {};
        const elements = options.selector ? options.selector(value) : value;

        if (!Array.isArray(elements)) {
          console.error("useValueIterator received non-array value");
          return null;
        }

        (elements as Element[]).forEach((element, index) => {
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
          const indexState = createState(index);

          if (!calculatedKey) {
            return;
          }

          let node = cb({ elementState, indexState });
          node.needExecutedVersion = true;

          elementsByKey[calculatedKey] = {
            node,
            indexState,
            indexValue: index,
            elementState,
          };

          children.push([node, calculatedKey, elementState]);
        });

        trackingParams.elementsByKey = elementsByKey;
        trackingParams.renderedElements = children;
        trackers.trackingIterators.push(trackingParams);
        onMount(() => {
          componentAPI.onUnmount(() => {
            trackers.trackingIterators = trackers.trackingIterators.filter(
              (currentTrackingParams) =>
                currentTrackingParams !== trackingParams
            );
          });
        });
        return createElement("div", {
          phantom: true,
          children: children.map((child) => child[0]),
        });
      });

      wrapperComponent.needExecutedVersion = true;

      trackingParams.cb = cb;
      trackingParams.key = options.key;
      trackingParams.wrapperComponent = wrapperComponent;

      if (options.selector) {
        trackingParams.selector = options.selector;
      }

      return wrapperComponent;

      // 1. build a lookup table with existing values
      // 2. build a lookup table with positions
      // 3. if there is a new value, update lookup tables
      //    and insert the new component in the right place
      // 4. provide a way to listen to position value.
      //    It should be a separate subscription.
    },
    useAttribute: (cb?: (value: T) => any) => {
      const originalValue = value;
      let wasMounted = false;
      const attributeValue = cb ? cb(value) : value;

      const attributeHelper = (
        htmlElement: HTMLElement,
        attributeName: string,
        node: VelesElement
      ) => {
        // save it to the attribute array
        // read that array on `_triggerUpdates`
        // and change inline
        // we need to save the HTML element and the name of the attribute
        const trackingElement = {
          cb,
          htmlElement,
          attributeName,
          attributeValue,
        };

        node._privateMethods._addMountHandler(() => {
          trackers.trackingAttributes.push(trackingElement);

          if (!wasMounted && value === originalValue) {
            /**
             * We avoid recalculating in one case:
             * 1. the component was never mounted
             * 2. the value didn't change
             *
             * Every other case will need to store their own value,
             * and while it is possible, for now we are not doing it
             */
          } else {
            // since the `element` will be modified in place, we don't need to
            // replace it in the array or anything
            updateUseAttributeValue({ element: trackingElement, value });
          }

          if (!wasMounted) {
            wasMounted = true;
          }

          node._privateMethods._addUnmountHandler(() => {
            trackers.trackingAttributes = trackers.trackingAttributes.filter(
              (trackingAttribute) => trackingAttribute !== trackingElement
            );
          });
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
    getPreviousValue: () => {
      return previousValue;
    },
    // set up new value only through the callback which
    // gives the latest value to ensure no outdated data
    // can be used for the state
    setValue: (newValueCB: ((currentValue: T) => T) | T): void => {
      const newValue =
        // @ts-expect-error
        typeof newValueCB === "function" ? newValueCB(value) : newValueCB;

      if (newValue !== value) {
        previousValue = value;
        value = newValue;
        triggerUpdates({ value, createState, trackers, getValue: () => value });
      }
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
