import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
} from "../../src";

import type { State } from "../../src";

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("useAttribute does not re-mount the component", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    function StateComponent() {
      onUnmount(spyFn);
      const valueState = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testvalue": valueState.useAttribute((value) => String(value)),
            "data-testid": "button",
            onClick: () => {
              valueState.setValue((currentValue) => currentValue + 1);
            },
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const btn = screen.getByTestId("button");
    expect(btn).toHaveAttribute("data-testvalue", "0");

    await user.click(btn);
    expect(btn).toHaveAttribute("data-testvalue", "1");

    await user.click(btn);
    expect(btn).toHaveAttribute("data-testvalue", "2");
    expect(spyFn).not.toHaveBeenCalled();
  });

  test("does not track updates in useAttribute until mounted", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();

    const valueState = createState("initialValue");
    function App() {
      const showState = createState(false);
      const content = createElement("div", {
        "data-testid": "attributeTest",
        "data-value": valueState.useAttribute((value) => {
          spyFn();
          return value;
        }),
      });
      return createElement("div", {
        children: [
          createElement("div", {
            children: "whatever",
          }),
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue((currentValue) => !currentValue),
          }),
          showState.useValue((shouldShow) => (shouldShow ? content : null)),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(spyFn).toHaveBeenCalledTimes(1);
    valueState.setValue("newValue1");
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("attributeTest").getAttribute("data-value")).toBe(
      "newValue1"
    );
    valueState.setValue("newValue2");
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId("attributeTest").getAttribute("data-value")).toBe(
      "newValue2"
    );

    // remove the element again to see that subscriptions are correctly removed
    await user.click(screen.getByTestId("button"));
    valueState.setValue("newValue3");
    expect(spyFn).toHaveBeenCalledTimes(3);
  });
});
