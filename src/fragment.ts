import { createElement } from "./create-element";
import { createTextElement } from "./create-element/create-text-element";

import type { VelesChildren } from "./types";

function Fragment({ children }: { children?: VelesChildren }) {
  const fragment = createElement("div", {
    phantom: true,
    children,
  });

  if (fragment.childComponents.length === 0) {
    const anchor = createTextElement("");
    anchor.parentVelesElement = fragment;
    fragment.childComponents.push(anchor);
    fragment.html.append(anchor.html);
  }

  return fragment;
}

export { Fragment };
