import {
  getExecutedComponentVelesNode,
  callMountHandlers,
  callUnmountHandlers,
  renderTree,
} from "./_utils";
import { createElement } from "./create-element";

import type { VelesElement, VelesComponentObject } from "./types";


/**
 * Attach Veles component tree to a regular HTML node.
 * Right now it will wrap the app into an additional `<div>` tag.
 * 
 * It returns a function which when executed, will remove the Veles
 * tree from DOM and remove all subscriptions.
 */
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
  // convert Veles tree into a tree which contains rendered Nodes
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
