import type { VelesElement } from "./types";

function attachComponent({
  htmlElement,
  component,
}: {
  htmlElement: HTMLElement;
  component: VelesElement;
}) {
  htmlElement.appendChild(component.html);
}

export { attachComponent };
