import type { VelesElement } from "../types";

function assignAttributes({
  props,
  htmlElement,
  velesNode,
}: {
  props: Record<string, any>;
  htmlElement: HTMLElement;
  velesNode: VelesElement;
}) {
  Object.entries(props).forEach(([key, value]) => {
    const isFunction = typeof value === "function";
    if (isFunction && value.velesAttribute === true) {
      const attributeValue = value(htmlElement, key, velesNode);
      assignAttribute({ key, value: attributeValue, htmlElement });
    } else {
      assignAttribute({ key, value, htmlElement });
    }
  });
}

function assignAttribute({
  key,
  value,
  htmlElement,
}: {
  key: string;
  value: any;
  htmlElement: HTMLElement;
}) {
  if (
    // basically, any form of `on` handlers, like `onClick`, `onCopy`, etc
    typeof value === "function" &&
    key.startsWith("on")
  ) {
    htmlElement.addEventListener(key.slice(2).toLocaleLowerCase(), value);
  } else {
    if (typeof value === "boolean") {
      // according to the spec, boolean values should just get either an empty string
      // or duplicated key. I don't see a reason to duplicate the key.
      // If the value is `false`, no need to set it, the correct behaviour is to remove it.
      if (value) htmlElement.setAttribute(key, "");
    } else {
      htmlElement.setAttribute(key, value);
    }
  }
}

export { assignAttributes };
