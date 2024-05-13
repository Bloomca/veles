import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState } from "../src";

describe("createState", () => {
  test("supports state updates", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.setValue((currentValue) => currentValue + 1);
            },
          }),
          valueState.useValue((value) =>
            createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current value is 0")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current value is 1")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 2")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 3")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 4")).toBeVisible();
  });
});
