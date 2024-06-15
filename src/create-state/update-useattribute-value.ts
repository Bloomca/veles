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

  // Boolean elements require either setting an empty string as a value,
  // or duplicate the attribute name. A lack of the attribute means
  // the value is `false`, so we need to treat it differently.
  if (typeof newAttributeValue === "boolean") {
    if (newAttributeValue) {
      htmlElement.setAttribute(attributeName, "");
    } else {
      htmlElement.removeAttribute(attributeName);
    }
    // check whether we are dealing with event handlers
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
      // we remove the previous value, `removeEventListener` needs
      // to have the same value as the one that was added
      htmlElement.removeEventListener(eventName, attributeValue);
    }
    if (newAttributeValue && typeof newAttributeValue === "function") {
      htmlElement.addEventListener(eventName, newAttributeValue);
    }
    // not the best approach, but it should work as expected
    // basically, update the array value in-place
    // we update it so that we can compare to the previous value if needed
    // and to remove a correct event handler
    element.attributeValue = newAttributeValue;
  } else {
    htmlElement.setAttribute(attributeName, newAttributeValue);
  }
}

export { updateUseAttributeValue };
