import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState, onUnmount } from "../src";

import type { State } from "../src";

function shallow(obj1: Record<string, any>, obj2: Record<string, any>) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every((key) => obj1[key] === obj2[key])
  );
}

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  // basic test to make sure that changing the value is reflected in
  // DOM components which are subscribed to the changes
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

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current value is 0")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current value is 1")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 2")).toBeVisible();
  });

  // a test to make sure that we can create a state in a parent component,
  // and then pass it down to a child and it will work as expected
  test("supports passing state as a prop", async () => {
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
          createElement(ReadingStateComponent, {
            valueState,
          }),
        ],
      });
    }

    function ReadingStateComponent({
      valueState,
    }: {
      valueState: State<number>;
    }) {
      return createElement("div", {
        children: [
          valueState.useValue((value) =>
            createElement("div", {
              children: [`child value is ${value}`],
            })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("child value is 0")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("child value is 1")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("child value is 2")).toBeVisible();
  });

  // test to check that we can create subscriptions inside a component
  // and they are called correctly when the state changes
  test("supports custom subscriptions to state", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    const onUnmountCheck = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value));

      onUnmount(() => onUnmountCheck);

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

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(spyFn).toHaveBeenLastCalledWith(2);

    expect(onUnmountCheck).not.toHaveBeenCalled();
  });

  it("supports custom subscriptions with state.trackValue with skipFirstCall option", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value), { skipFirstCall: true });

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

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(2);
  });

  it("supports custom subscriptions with state.trackValue with callOnMount option", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value), { callOnMount: true });

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

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(0);

    // wait until the component is mounted in DOM
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(spyFn).toHaveBeenLastCalledWith(2);
  });

  // test to make sure that `useValueSelector` is correctly called only when
  // the selector function returns a different result
  test("support selector functions correctly with useValueSelector", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState = createState({
        firstValue: 0,
        secondValue: 0,
      });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "firstValueButton",
            onClick: () => {
              valueState.setValue((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              valueState.setValue((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          valueState.useValueSelector(
            (value) => value.secondValue,
            (value) => createElement(SecondValueComponent, { value })
          ),
        ],
      });
    }

    const unmountSpy = jest.fn();
    function SecondValueComponent({ value }: { value: number }) {
      onUnmount(unmountSpy);
      return createElement("div", {
        children: [`second value is ${value}`],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("second value is 0")).toBeVisible();
    await user.click(screen.getByTestId("secondValueButton"));
    expect(await screen.findByText("second value is 1")).toBeVisible();
    expect(unmountSpy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId("firstValueButton"));
    expect(unmountSpy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId("secondValueButton"));
    expect(await screen.findByText("second value is 2")).toBeVisible();
    expect(unmountSpy).toHaveBeenCalledTimes(2);
  });

  test("supports custom comparator in useValue", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState = createState({
        firstValue: 0,
        secondValue: 0,
      });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "firstValueButton",
            onClick: () => {
              valueState.setValue((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              valueState.setValue((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "fakeValueButton",
            onClick: () => {
              valueState.setValue((currentValue) => ({
                ...currentValue,
              }));
            },
          }),
          valueState.useValue(
            (value) =>
              createElement(ValueComponent, {
                value: value.firstValue + value.secondValue,
              }),
            shallow
          ),
        ],
      });
    }

    const unmountSpy = jest.fn();
    function ValueComponent({ value }: { value: number }) {
      onUnmount(unmountSpy);
      return createElement("div", {
        children: `total value is ${value}`,
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("total value is 0")).toBeVisible();
    await user.click(screen.getByTestId("secondValueButton"));
    expect(await screen.findByText("total value is 1")).toBeVisible();
    expect(unmountSpy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId("firstValueButton"));
    expect(unmountSpy).toHaveBeenCalledTimes(2);
    await user.click(screen.getByTestId("secondValueButton"));
    expect(await screen.findByText("total value is 3")).toBeVisible();
    expect(unmountSpy).toHaveBeenCalledTimes(3);
    await user.click(screen.getByTestId("fakeValueButton"));
    expect(await screen.findByText("total value is 3")).toBeVisible();
    expect(unmountSpy).toHaveBeenCalledTimes(3);
  });

  test("useValueIterator does not re-mount values which did not change their keys", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const unmountSpy = jest.fn();
    function IteratorComponent() {
      const state = createState<Item[]>([item1, item3, item4]);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "updateArrayButton",
            onClick: () => {
              state.setValue(() => [item2, item1, item3, item5]);
            },
            children: ["update array values"],
          }),
          createElement("button", {
            "data-testid": "updateFirstItem",
            onClick: () => {
              state.setValue((currentValues) =>
                currentValues.map((value) => {
                  if (value.id === 1) {
                    return {
                      id: 1,
                      text: "updated first value",
                    };
                  } else {
                    return value;
                  }
                })
              );
            },
          }),
          createElement("ul", {
            "data-testid": "listComponent",
            children: [
              state.useValueIterator<Item>({ key: "id" }, ({ elementState }) =>
                createElement(() => {
                  onUnmount(unmountSpy);
                  return createElement("li", {
                    children: [
                      elementState.useValueSelector(
                        (element) => element.text,
                        (text) => createElement("span", { children: text })
                      ),
                    ],
                  });
                })
              ),
            ],
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(IteratorComponent),
    });

    const listElement = screen.getByTestId("listComponent");
    expect(listElement.childNodes.length).toBe(3);
    const firstListElement = listElement.childNodes[0];
    const secondListElement = listElement.childNodes[1];
    const thirdListElement = listElement.childNodes[2];

    expect(firstListElement.textContent).toBe(item1.text);
    expect(secondListElement.textContent).toBe(item3.text);
    expect(thirdListElement.textContent).toBe(item4.text);

    await user.click(screen.getByTestId("updateFirstItem"));
    expect(unmountSpy).not.toHaveBeenCalled();
    expect(listElement.childNodes[0].textContent).toBe("updated first value");

    await user.click(screen.getByTestId("updateArrayButton"));
    expect(listElement.childNodes.length).toBe(4);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
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

  test("supports strings as returned value in useValue", async () => {
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
          createElement("div", {
            children: valueState.useValue(
              (value) => `current value is ${value}`
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current value is 0")).toBeVisible();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current value is 1")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 2")).toBeVisible();
  });

  test("correctly supports null as a return value in useValue", async () => {
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
          createElement("div", {
            children: valueState.useValue((value) =>
              value === 0 ? null : `current value is ${value}`
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(screen.queryByText("current value is 0")).not.toBeInTheDocument();
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(await screen.findByText("current value is 1")).toBeVisible();

    await user.click(btn);
    expect(await screen.findByText("current value is 2")).toBeVisible();
  });
});
