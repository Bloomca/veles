import { screen } from "@testing-library/dom";

import { attachComponent, createElement } from "../src";

describe("attachComponent", () => {
  test("attaches component tree correctly", () => {
    attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "attachedComponent",
        children: ["test"],
      }),
    });

    const docElement = screen.getByTestId("attachedComponent");
    expect(docElement).toBeVisible();
  });
});
