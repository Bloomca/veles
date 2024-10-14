import { createElement } from "./create-element";

import type { VelesChildren } from "./types";

function Portal({
  children,
  portalNode,
}: {
  children?: VelesChildren;
  portalNode: HTMLElement;
}) {
  return createElement("div", {
    portal: portalNode,
    children,
  });
}

export { Portal };
