import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
} from "../../src";

describe("state.attribute", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("attribute does not re-mount the component", async () => {
    const user = userEvent.setup();
    const spyFn = vi.fn();
    function StateComponent() {
      onUnmount(spyFn);
      const value$ = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testvalue": value$.attribute((value) => String(value)),
            "data-testid": "button",
            onClick: () => {
              value$.update((currentValue) => currentValue + 1);
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

  test("does not track updates in attribute until mounted", async () => {
    const user = userEvent.setup();
    const spyFn = vi.fn();

    const value$ = createState("initialValue");
    function App() {
      const show$ = createState(false);
      const content = createElement("div", {
        "data-testid": "attributeTest",
        "data-value": value$.attribute((value) => {
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
            onClick: () => show$.update((currentValue) => !currentValue),
          }),
          show$.render((shouldShow) => (shouldShow ? content : null)),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(spyFn).toHaveBeenCalledTimes(1);
    value$.set("newValue1");
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("attributeTest").getAttribute("data-value")).toBe(
      "newValue1"
    );
    value$.set("newValue2");
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId("attributeTest").getAttribute("data-value")).toBe(
      "newValue2"
    );

    // remove the element again to see that subscriptions are correctly removed
    await user.click(screen.getByTestId("button"));
    value$.set("newValue3");
    expect(spyFn).toHaveBeenCalledTimes(3);

    value$.set("initialValue");
    await user.click(screen.getByTestId("button"));
    expect(screen.getByTestId("attributeTest").getAttribute("data-value")).toBe(
      "initialValue"
    );
  });
});
