import { unique } from "../_utils";
import { updateUseValueSelector } from "./update-render-selected-value";
import { updateUseAttributeValue } from "./update-useattribute-value";
import { updateUseValueIteratorValue } from "./update-render-each-value";

import type { createState as createStateType, StateTrackers } from "./types";

function triggerUpdates<T>({
  value,
  createState,
  trackers,
  get,
}: {
  value: T;
  createState: typeof createStateType;
  trackers: StateTrackers;
  get: () => T;
}) {
  const newTrackingSelectorElements: StateTrackers["trackingSelectorElements"] =
    [];
  trackers.trackingSelectorElements.forEach((selectorTrackingElement) =>
    updateUseValueSelector({
      value,
      selectorTrackingElement,
      newTrackingSelectorElements,
      trackers,
      get,
    }),
  );

  trackers.trackingSelectorElements = unique(
    trackers.trackingSelectorElements.concat(newTrackingSelectorElements),
  );

  // attributes
  // the HTML node does not change, so we don't need to modify the array
  trackers.trackingAttributes.forEach((element) => {
    updateUseAttributeValue({ element, value });
  });

  trackers.trackingIterators.forEach((trackingIterator) => {
    updateUseValueIteratorValue({ value, trackingIterator, createState });
  });
}

export { triggerUpdates };
