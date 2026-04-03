import { assignDomAttribute } from "../attribute-utils";

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
    if (value && typeof value === "object" && value.velesAttribute === true) {
      const attributeValue = value.getValue(htmlElement, key, velesNode);
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
    assignDomAttribute({
      htmlElement,
      attributeName: key,
      value,
    });
  }
}

export { assignAttributes };
