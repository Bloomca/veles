import { createElement } from "./create-element";

import type { VelesChildren } from "./types";

function Fragment({ children }: { children: VelesChildren }) {
  return createElement("div", {
    phantom: true,
    children,
  });
}

export { Fragment };
