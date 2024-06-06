import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState } from "../../src";
import { combineState, selectState } from "../../src/utils";

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("allows to combine several states", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState1 = createState(1);
      const valueState2 = createState(1);
      const valueState3 = createState(1);
      const combinedValueState = combineState(
        valueState1,
        valueState2,
        valueState3
      );
      const changedState = selectState(
        combinedValueState,
        ([value1, value2, value3]) => value1 * value2 * value3
      );

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button1",
            onClick: () => {
              valueState1.setValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button2",
            onClick: () => {
              valueState2.setValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button3",
            onClick: () => {
              valueState3.setValue((currentValue) => currentValue + 1);
            },
          }),
          changedState.useValue((value) =>
            createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current value is 1")).toBeVisible();
    const btn1 = screen.getByTestId("button1");
    const btn2 = screen.getByTestId("button2");
    const btn3 = screen.getByTestId("button3");

    await user.click(btn1);
    await user.click(btn1);
    await user.click(btn3);
    expect(await screen.findByText("current value is 6")).toBeVisible();

    await user.click(btn2);
    await user.click(btn2);
    await user.click(btn1);
    expect(await screen.findByText("current value is 24")).toBeVisible();
  });
});
