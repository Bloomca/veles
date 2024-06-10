import { unique } from "../_utils";
import { updateUseValueSelector } from "./update-usevalue-selector-value";
import { updateUseAttributeValue } from "./update-useattribute-value";
import { updateUseValueIteratorValue } from "./update-usevalueiterator-value";

import type { createState as createStateType, StateTrackers } from "./types";

function triggerUpdates<T>({
  value,
  createState,
  trackers,
  getValue,
}: {
  value: T;
  createState: typeof createStateType;
  trackers: StateTrackers;
  getValue: () => T;
}) {
  const newTrackingSelectorElements: StateTrackers["trackingSelectorElements"] =
    [];
  trackers.trackingSelectorElements.forEach((selectorTrackingElement) =>
    updateUseValueSelector({
      value,
      selectorTrackingElement,
      newTrackingSelectorElements,
      trackers,
      getValue,
    })
  );

  trackers.trackingSelectorElements = unique(
    trackers.trackingSelectorElements.concat(newTrackingSelectorElements)
  );

  // attributes
  // the HTML node does not change, so we don't need to modify the array
  trackers.trackingAttributes.forEach((element) => {
    updateUseAttributeValue({ element, value });
  });

  // tracked values
  trackers.trackingEffects.forEach((trackingEffect) => {
    const { cb, selectedValue, selector, comparator } = trackingEffect;

    const newSelectedValue = selector ? selector(value) : value;

    if (
      comparator
        ? comparator(selectedValue, newSelectedValue)
        : selectedValue === newSelectedValue
    ) {
      return;
    }

    cb(newSelectedValue);
    // update selected value
    trackingEffect.selectedValue = newSelectedValue;
  });

  trackers.trackingIterators.forEach((trackingIterator) => {
    updateUseValueIteratorValue({ value, trackingIterator, createState });
  });
}

export { triggerUpdates };
