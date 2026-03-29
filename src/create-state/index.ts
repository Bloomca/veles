import { identity } from "../_utils";
import {
  hasCurrentLifecycleContext,
  onUnmount,
  onMount,
} from "../hooks/lifecycle";
import { createElement } from "../create-element/create-element";
import { createTextElement } from "../create-element/create-text-element";
import { triggerUpdates } from "./trigger-updates";
import { addUseValueMountHandler } from "./update-render-selected-value";
import { updateUseAttributeValue } from "./update-useattribute-value";
import { getCurrentContext } from "../context";
import { StateCore, createCoreEquality, emptyValue } from "./state-core";

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

const STATE_CORE_PROPERTY = "__velesStateCore";

function getStateCore<T>(state: State<T>): StateCore<T> {
  const core = (state as any)[STATE_CORE_PROPERTY] as StateCore<T> | undefined;

  if (!core) {
    throw new Error("Can't find state core");
  }

  return core;
}

function autoDisposeStateOnUnmount<T>(state: State<T>) {
  if (hasCurrentLifecycleContext()) {
    onUnmount(() => {
      state.dispose();
    });
  }

  return state;
}

type RenderSelectedSignature<T> = {
  (
    selector: undefined,
    cb?: (
      value: T,
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator?: (value1: T, value2: T) => boolean,
  ): VelesElement | VelesComponentObject | VelesStringElement;
  <F>(
    selector: (value: T) => F,
    cb?: (
      value: F,
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator?: (value1: F, value2: F) => boolean,
  ): VelesElement | VelesComponentObject | VelesStringElement;
};

function createStateFromCore<T>(
  core: StateCore<T>,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"],
  ) => Function,
): State<T> {
  // all subscription types we track
  const trackers: StateTrackers = {
    trackingSelectorElements: [],
    trackingAttributes: [],
    trackingIterators: [],
  };

  core.on((nextValue) => {
    triggerUpdates({
      value: nextValue,
      createState,
      trackers,
      getValue: () => core.get() as T,
    });
  });

  const renderSelected: RenderSelectedSignature<T> = ((
    selector: ((value: T) => unknown) | undefined,
    cb?: (
      value: unknown,
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator: (value1: unknown, value2: unknown) => boolean = identity,
  ) => {
    const currentValue = core.get() as T;

    if (selector) {
      const selectedValue = selector(currentValue);
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
        usedValue: currentValue,
        getValue: () => core.get() as T,
        trackers,
        trackingSelectorElement,
      });

      return node;
    }

    const selectedValue = currentValue;
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
      usedValue: currentValue,
      getValue: () => core.get() as T,
      trackers,
      trackingSelectorElement,
    });

    return node;
  }) as RenderSelectedSignature<T>;

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
      } = {},
    ) {
      const selectedCore = selector
        ? core.map(selector, {
            equality: createCoreEquality(options.comparator),
          })
        : options.comparator
          ? core.map((value) => value as unknown as F, {
              equality: createCoreEquality(options.comparator),
            })
          : (core as unknown as StateCore<F>);

      let latestCleanup: Function | void;
      const trackedValue = selectedCore.get() as F;

      const runCallback = (value: F) => {
        if (latestCleanup) {
          latestCleanup();
        }

        latestCleanup = cb(value);
      };

      if (!options.skipFirstCall) {
        // trigger the callback first time
        // execute the first callback when the component is mounted
        if (options.callOnMount) {
          onMount(() => {
            runCallback(trackedValue);
          });
        } else {
          runCallback(trackedValue);
        }
      }

      const unsubscribe = selectedCore.on((newSelectedValue) => {
        runCallback(newSelectedValue as F);
      });

      // track value is attached at the component level
      onUnmount(() => {
        unsubscribe();

        if (latestCleanup) {
          latestCleanup();
        }

        if ((selectedCore as unknown) !== (core as unknown)) {
          selectedCore.dispose();
        }
      });
    },
    render: (cb, comparator) => {
      return result.renderSelected(undefined, cb, comparator);
    },
    renderSelected,
    /**
     * This function is used to iterate over the values and return tracked DOM nodes.
     * When using it, the callback receives elementState and indexState props object
     * to track changes; this way individual changes will not trigger any component
     * re-renders.
     */
    useValueIterator<Element>(
      options: {
        key: string | ((options: { element: any; index: number }) => string);
        selector?: (value: T) => Element[];
      },
      cb: (props: {
        elementState: State<Element>;
        indexState: State<number>;
      }) => VelesElement | VelesComponentObject,
    ) {
      const currentContext = getCurrentContext();
      const trackingParams = {} as TrackingIterator;
      trackingParams.savedContext = currentContext;

      const wrapperComponent = createElement((_props, componentAPI) => {
        const children: [
          VelesElement | VelesComponentObject,
          string,
          State<Element>,
        ][] = [];
        const elementsByKey: {
          [key: string]: {
            elementState: State<Element>;
            indexState: State<number>;
            indexValue: number;
            node: VelesElement | VelesComponentObject;
          };
        } = {};
        const stateValue = core.get() as T;
        const elements = options.selector
          ? options.selector(stateValue)
          : stateValue;

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
                currentTrackingParams !== trackingParams,
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
    map: <F>(
      selector: (value: T) => F,
      options: {
        equality?: (value1: F, value2: F) => boolean;
      } = {},
    ) => {
      const selectedCore = core.map(selector, {
        equality: createCoreEquality(options.equality),
      });

      return autoDisposeStateOnUnmount(createStateFromCore(selectedCore));
    },
    filter: (
      predicate: (value: T, prevValue?: T) => boolean,
      options: {
        equality?: (value1: T, value2: T) => boolean;
      } = {},
    ) => {
      const filteredCore = core.filter(
        (value, prevValue) =>
          predicate(
            value,
            prevValue === emptyValue ? undefined : (prevValue as T),
          ),
        {
          equality: createCoreEquality(options.equality),
        },
      );

      return autoDisposeStateOnUnmount(createStateFromCore(filteredCore));
    },
    scan: <V>(
      reducer: (acc: V, value: T, prevValue?: T) => V,
      initialValue: V,
      options: {
        equality?: (value1: V, value2: V) => boolean;
      } = {},
    ) => {
      const scannedCore = core.scan(
        (acc, value, prevValue) =>
          reducer(
            acc,
            value,
            prevValue === emptyValue ? undefined : (prevValue as T),
          ),
        initialValue,
        {
          equality: createCoreEquality(options.equality),
        },
      );

      return autoDisposeStateOnUnmount(createStateFromCore(scannedCore));
    },
    combine: (...states) => {
      const stateCores = states.map((state) => getStateCore(state));
      const combinedCore = core.combine(...stateCores);

      return autoDisposeStateOnUnmount(
        createStateFromCore(combinedCore as any),
      );
    },
    attribute: (cb?: (value: T) => any) => {
      const originalValue = core.get() as T;
      let wasMounted = false;
      const attributeValue = cb ? cb(originalValue) : originalValue;

      const attributeHelper = (
        htmlElement: HTMLElement,
        attributeName: string,
        node: VelesElement,
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

          if (!wasMounted && core.get() === originalValue) {
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
            updateUseAttributeValue({
              element: trackingElement,
              value: core.get(),
            });
          }

          if (!wasMounted) {
            wasMounted = true;
          }

          node._privateMethods._addUnmountHandler(() => {
            trackers.trackingAttributes = trackers.trackingAttributes.filter(
              (trackingAttribute) => trackingAttribute !== trackingElement,
            );
          });
        });

        return attributeValue;
      };
      attributeHelper.velesAttribute = true;

      return attributeHelper;
    },
    dispose: () => {
      core.dispose();
    },
    // useful for stuff like callbacks
    getValue: () => {
      return core.get() as T;
    },
    getPreviousValue: () => {
      const previousValue = core.getPrevious();

      return previousValue === emptyValue
        ? undefined
        : (previousValue as undefined | T);
    },
    setValue: (newValue: T): void => {
      core.set(newValue);
    },
    updateValue: (newValueCB: (currentValue: T) => T): void => {
      const currentValue = core.get() as T;
      core.set(newValueCB(currentValue));
    },
  };

  (result as any)[STATE_CORE_PROPERTY] = core;

  if (subscribeCallback) {
    const unsubscribe = subscribeCallback(result.setValue);

    if (unsubscribe) {
      onUnmount(unsubscribe);
    }
  }

  return result;
}

/**
 * Main state factory function.
 *
 * This primitive is a small observable implementation,
 * which is tightly integrated with the UI framework for two things:
 *
 * - based on subscription callback, update DOM node and replace it
 * - correctly unsubscribe when the Node/component is unmounted
 */
function createState<T>(
  initialValue: T,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"],
  ) => Function,
): State<T> {
  const core = new StateCore<T>(initialValue);
  return createStateFromCore(core, subscribeCallback);
}

namespace createState {
  export const empty = emptyValue;
}

export { createState, createStateFromCore, getStateCore };
