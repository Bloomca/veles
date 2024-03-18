import { getComponentVelesNode } from "./utils";

import type { VelesElement, VelesComponent } from "./types";

function attachComponent({
  htmlElement,
  component,
}: {
  htmlElement: HTMLElement;
  component: VelesElement | VelesComponent;
}) {
  htmlElement.appendChild(
    getComponentVelesNode(component).velesElementNode.html
  );
}

export { attachComponent };
