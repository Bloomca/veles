import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState } from "../../src";
import { combineState } from "../../src/utils";

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("allows to combine several states", async () => {
    const spy = jest.fn();
    const user = userEvent.setup();
    function StateComponent() {
      const valueState1 = createState(0);
      const valueState2 = createState(0);
      const valueState3 = createState(0);
      const combinedValueState = combineState(
        valueState1,
        valueState2,
        valueState3
      );

      combinedValueState.trackValue(spy);

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
          combinedValueState.useValueSelector(
            (values) => values.reduce((acc, num) => acc + num, 0),
            (value) =>
              createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spy).toHaveBeenCalledTimes(1);

    expect(await screen.findByText("current value is 0")).toBeVisible();
    const btn1 = screen.getByTestId("button1");
    const btn2 = screen.getByTestId("button2");
    const btn3 = screen.getByTestId("button3");

    await user.click(btn1);
    await user.click(btn1);
    await user.click(btn3);
    expect(await screen.findByText("current value is 3")).toBeVisible();

    expect(spy).toHaveBeenCalledTimes(4);

    await user.click(btn2);
    await user.click(btn2);
    await user.click(btn1);
    expect(await screen.findByText("current value is 6")).toBeVisible();

    expect(spy).toHaveBeenCalledTimes(7);
  });
});
