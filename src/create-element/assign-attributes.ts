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
  const { onClick, ...otherProps } = props;
  // we need to assign attributes after `velesNode` is initialized
  // so that we can correctly handle unmount callbacks
  Object.entries(otherProps).forEach(([key, value]) => {
    if (typeof value === "function" && value.velesAttribute === true) {
      const attributeValue = value(htmlElement, key, velesNode);
      htmlElement.setAttribute(key, attributeValue);
    } else {
      htmlElement.setAttribute(key, value);
    }
  });

  if (onClick) {
    htmlElement.addEventListener("click", onClick);
  }
}

export { assignAttributes };
