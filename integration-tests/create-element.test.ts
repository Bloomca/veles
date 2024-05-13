import { screen } from "@testing-library/dom";

import { attachComponent, createElement } from "../src";

describe("createElement", () => {
  test("supports nested components correctly", () => {
    attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "attachedComponent",
        children: [
          createElement("div", {
            "data-testid": "nestedComponent",
            children: [
              createElement("div", {
                "data-testid": "moreNestedComponent",
              }),
            ],
          }),
        ],
      }),
    });

    expect(screen.getByTestId("nestedComponent")).toBeVisible();
    expect(screen.getByTestId("moreNestedComponent")).toBeVisible();
  });

  test("support function components", async () => {
    function SecondComponent() {
      return createElement("div", {
        children: ["Second component"],
      });
    }

    function FirstComponent() {
      return createElement("div", {
        children: [
          createElement("div", { children: "First component" }),
          createElement(SecondComponent),
        ],
      });
    }

    attachComponent({
      htmlElement: document.body,
      component: createElement(FirstComponent),
    });

    expect(await screen.findByText("First component")).toBeVisible();
    expect(await screen.findByText("Second component")).toBeVisible();
  });
});
