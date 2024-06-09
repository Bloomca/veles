import type { TrackingAttribute } from "./types";

function updateUseAttributeValue<T>({
  element,
  value,
}: {
  element: TrackingAttribute;
  value: T;
}) {
  const { cb, htmlElement, attributeName, attributeValue } = element;
  const newAttributeValue = cb ? cb(value) : value;

  if (typeof newAttributeValue === "boolean") {
    if (newAttributeValue) {
      htmlElement.setAttribute(attributeName, "");
    } else {
      htmlElement.removeAttribute(attributeName);
    }
  } else if (attributeName.startsWith("on")) {
    // if the value is the same, it is either not set
    // or we received the same event handler
    // either way, no need to do anything
    if (attributeValue === newAttributeValue) {
      return;
    }

    const eventName =
      attributeName[2].toLocaleLowerCase() + attributeName.slice(3);
    if (attributeValue) {
      htmlElement.removeEventListener(eventName, attributeValue);
    }
    if (newAttributeValue && typeof newAttributeValue === "function") {
      htmlElement.addEventListener(eventName, newAttributeValue);
    }
    // not the best approach, but it should work as expected
    // basically, update the array value in-place
    element.attributeValue = newAttributeValue;
  } else {
    htmlElement.setAttribute(attributeName, newAttributeValue);
  }
}

export { updateUseAttributeValue };
