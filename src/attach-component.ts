import {
  getExecutedComponentVelesNode,
  callMountHandlers,
  callUnmountHandlers,
  renderTree,
} from "./_utils";
import { createElement } from "./create-element";

import type { VelesElement, VelesComponentObject } from "./types";

function attachComponent({
  htmlElement,
  component,
}: {
  htmlElement: HTMLElement;
  component: VelesElement | VelesComponentObject;
}) {
  // we wrap the whole app into an additional <div>. While it is not ideal
  // for the consumers, it greatly simplifies some things, namely, mount callbacks
  // for components or supporting conditional rendering at the top level
  const wrappedApp = createElement("div", { children: [component] });
  const wrappedAppTree = renderTree(wrappedApp);
  const velesElementNode = getExecutedComponentVelesNode(wrappedAppTree);
  htmlElement.appendChild(velesElementNode.html);
  callMountHandlers(wrappedAppTree);

  return () => {
    callUnmountHandlers(wrappedAppTree);
    velesElementNode.html.remove();
  };
}

export { attachComponent };
