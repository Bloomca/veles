import { getComponentVelesNode } from "./utils";
import { createElement } from "./create-element";

import type { VelesElement, VelesComponent } from "./types";

function attachComponent({
  htmlElement,
  component,
}: {
  htmlElement: HTMLElement;
  component: VelesElement | VelesComponent;
}) {
  // we wrap the whole app into an additional <div>. While it is not ideal
  // for the consumers, it greatly simplifies some things, namely, mount callbacks
  // for components or supporting conditional rendering at the top level
  const wrappedApp = createElement("div", { children: [component] });
  const { velesElementNode } = getComponentVelesNode(wrappedApp);
  htmlElement.appendChild(velesElementNode.html);
}

export { attachComponent };
