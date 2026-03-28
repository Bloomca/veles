import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState } from "../../src";

describe("derived state", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("allows to combine several states", async () => {
    const spy = vi.fn();
    const user = userEvent.setup();

    function StateComponent() {
      const valueState1 = createState(0);
      const valueState2 = createState(0);
      const valueState3 = createState(0);
      const combinedValueState = valueState1.combine(valueState2, valueState3);

      combinedValueState.trackValue(spy);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button1",
            onClick: () => {
              valueState1.updateValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button2",
            onClick: () => {
              valueState2.updateValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button3",
            onClick: () => {
              valueState3.updateValue((currentValue) => currentValue + 1);
            },
          }),
          combinedValueState.useValueSelector(
            (values) => values.reduce((acc, num) => acc + num, 0),
            (value) =>
              createElement("div", { children: [`current value is ${value}`] }),
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

  test("allows to map combined state", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const valueState1 = createState(1);
      const valueState2 = createState(1);
      const valueState3 = createState(1);
      const changedState = valueState1
        .combine(valueState2, valueState3)
        .map(([value1, value2, value3]) => value1 * value2 * value3);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button1",
            onClick: () => {
              valueState1.updateValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button2",
            onClick: () => {
              valueState2.updateValue((currentValue) => currentValue + 1);
            },
          }),
          createElement("button", {
            "data-testid": "button3",
            onClick: () => {
              valueState3.updateValue((currentValue) => currentValue + 1);
            },
          }),
          changedState.render((value) =>
            createElement("div", { children: [`current value is ${value}`] }),
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

  test("allows to use comparator in map", () => {
    const firstSpy = vi.fn();
    const secondSpy = vi.fn();
    const state = createState({
      firstValue: 1,
      secondValue: 2,
    });

    function StateComponent() {
      const selectedState = state.map((value) => value, {
        equality: (a, b) =>
          a.firstValue === b.firstValue && a.secondValue === b.secondValue,
      });
      const selectedStateNoComparator = state.map((value) => value);
      selectedState.trackValue(firstSpy);
      selectedStateNoComparator.trackValue(secondSpy);

      return null;
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(firstSpy).toHaveBeenCalledTimes(1);
    expect(secondSpy).toHaveBeenCalledTimes(1);

    state.setValue({ firstValue: 2, secondValue: 5 });
    expect(firstSpy).toHaveBeenCalledTimes(2);
    expect(secondSpy).toHaveBeenCalledTimes(2);

    state.setValue({ firstValue: 2, secondValue: 5 });
    expect(firstSpy).toHaveBeenCalledTimes(2);
    expect(secondSpy).toHaveBeenCalledTimes(3);
  });

  test("allows to filter derived state", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const numberState = createState(1);
      const evenNumberState = numberState.filter((value) => value % 2 === 0);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              numberState.updateValue((currentValue) => currentValue + 1);
            },
          }),
          evenNumberState.render((value) =>
            createElement("div", {
              children: [
                `current even value is ${((value as any) === createState.empty) ? "empty" : value}`,
              ],
            }),
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current even value is empty")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current even value is 2")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current even value is 2")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current even value is 4")).toBeVisible();
  });

  test("allows to scan derived state", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const numberState = createState(1);
      const totalState = numberState.scan((acc, value) => acc + value, 0);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              numberState.updateValue((currentValue) => currentValue + 1);
            },
          }),
          totalState.render((value) =>
            createElement("div", {
              children: [`current total value is ${value}`],
            }),
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current total value is 1")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current total value is 3")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current total value is 6")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current total value is 10")).toBeVisible();
  });
});
