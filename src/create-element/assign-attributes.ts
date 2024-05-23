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
      htmlElement.setAttribute(key, attributeValue);
    } else if (
      // basically, any form of `on` handlers, like `onClick`, `onCopy`, etc
      isFunction &&
      key.length > 2 &&
      key.startsWith("on")
    ) {
      // TODO: think if this is robust enough
      htmlElement.addEventListener(
        key[2].toLocaleLowerCase() + key.slice(3),
        value
      );
    } else {
      htmlElement.setAttribute(key, value);
    }
  });
}

export { assignAttributes };
