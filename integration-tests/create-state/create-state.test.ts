import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
} from "../../src";

import type { State } from "../../src";

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
              valueState.update((currentValue) => currentValue + 1);
            },
          }),
          valueState.render((value) =>
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

  test("supports direct state updates", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const nameState = createState("");
      return createElement("div", {
        children: [
          createElement("input", {
            "data-testid": "nameInput",
            onInput: (e) => {
              nameState.set(e.target.value);
            },
          }),
          nameState.render((value) =>
            createElement("div", { children: [`current name is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const nameInput = screen.getByTestId("nameInput");
    await user.type(nameInput, "Veles");
    expect(await screen.findByText("current name is Veles")).toBeVisible();
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
              valueState.update((currentValue) => currentValue + 1);
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
          valueState.render((value) =>
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

  // test to make sure that `renderSelected` is correctly called only when
  // the selector function returns a different result
  test("support selector functions correctly with renderSelected", async () => {
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
              valueState.update((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              valueState.update((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          valueState.renderSelected(
            (value) => value.secondValue,
            (value) => createElement(SecondValueComponent, { value })
          ),
        ],
      });
    }

    const unmountSpy = vi.fn();
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

  test("supports custom comparator in render", async () => {
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
              valueState.update((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              valueState.update((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "fakeValueButton",
            onClick: () => {
              valueState.update((currentValue) => ({
                ...currentValue,
              }));
            },
          }),
          valueState.render(
            (value) =>
              createElement(ValueComponent, {
                value: value.firstValue + value.secondValue,
              }),
            shallow
          ),
        ],
      });
    }

    const unmountSpy = vi.fn();
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

  test("supports strings as returned value in render", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.update((currentValue) => currentValue + 1);
            },
          }),
          createElement("div", {
            children: valueState.render(
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

  test("correctly supports null as a return value in render", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const valueState = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.update((currentValue) => currentValue + 1);
            },
          }),
          createElement("div", {
            children: valueState.render((value) =>
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

  test("supports no callback in render to return the value directly", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const titleState = createState("title");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              titleState.set("new title");
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: titleState.render(),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(screen.getByTestId("container").textContent).toBe("title");
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(screen.getByTestId("container").textContent).toBe("new title");
  });

  test("supports no callback in renderSelected to return the value directly", async () => {
    const user = userEvent.setup();
    function StateComponent() {
      const titleState = createState({ title: "title" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              titleState.set({ title: "new title" });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: titleState.renderSelected((data) => data.title),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(screen.getByTestId("container").textContent).toBe("title");
    const btn = screen.getByTestId("button");

    await user.click(btn);
    expect(screen.getByTestId("container").textContent).toBe("new title");
  });

  test("supports state changes correctly when conditional returns true/false/true", async () => {
    let newValue = "";
    const user = userEvent.setup();
    function StateComponent() {
      const titleState = createState({ title: "title" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              titleState.set({ title: newValue });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: titleState.renderSelected(
              (data) => data.title.length > 3,
              (isLong) =>
                isLong
                  ? createElement(ConditionalComponent, { state: titleState })
                  : null
            ),
          }),
        ],
      });
    }

    function ConditionalComponent({
      state,
    }: {
      state: State<{ title: string }>;
    }) {
      return createElement("div", {
        children: [
          createElement("div", {
            "data-testid": "text",
            children: state.render(
              (value) => `length is ${value.title.length}`
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(screen.getByTestId("text").textContent).toBe("length is 5");
    const btn = screen.getByTestId("button");

    newValue = "";
    await user.click(btn);

    newValue = "new title";
    await user.click(btn);
    expect(screen.getByTestId("text").textContent).toBe("length is 9");

    newValue = "another new title";
    await user.click(btn);
    expect(screen.getByTestId("text").textContent).toBe("length is 17");
  });

  test("supports state changes correctly when conditional is not rendered initially", async () => {
    let newValue = "";
    const user = userEvent.setup();
    function StateComponent() {
      const titleState = createState({ title: "" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              titleState.set({ title: newValue });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: titleState.renderSelected(
              (data) => data.title.length > 3,
              (isLong) =>
                isLong
                  ? createElement(ConditionalComponent, { state: titleState })
                  : null
            ),
          }),
        ],
      });
    }

    function ConditionalComponent({
      state,
    }: {
      state: State<{ title: string }>;
    }) {
      return createElement("div", {
        children: [
          createElement("div", {
            "data-testid": "text",
            children: state.render(
              (value) => `length is ${value.title.length}`
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const btn = screen.getByTestId("button");

    newValue = "title";
    await user.click(btn);
    expect(screen.getByTestId("text").textContent).toBe("length is 5");

    newValue = "new title";
    await user.click(btn);
    expect(screen.getByTestId("text").textContent).toBe("length is 9");

    newValue = "another new title";
    await user.click(btn);
    expect(screen.getByTestId("text").textContent).toBe("length is 17");
  });

  test("does not execute nested callbacks when top-level conditional with same selector updates", async () => {
    const user = userEvent.setup();

    const topLevelRenderSpy = vi.fn();
    const firstNestedRenderSpy = vi.fn();
    const secondNestedRenderSpy = vi.fn();

    function App() {
      const streamState = createState({ value: 0 });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () =>
              streamState.update((value) => ({
                value: value.value + 1,
              })),
          }),
          createElement(TopLevelConditional, { streamState }),
        ],
      });
    }

    function TopLevelConditional({
      streamState,
    }: {
      streamState: State<{ value: number }>;
    }) {
      return streamState.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          topLevelRenderSpy(isEven);

          return isEven
            ? createElement(FirstNestedConditional, { streamState })
            : createElement("div", {
                "data-testid": "top-level-odd",
                children: "top level odd",
              });
        }
      );
    }

    function FirstNestedConditional({
      streamState,
    }: {
      streamState: State<{ value: number }>;
    }) {
      return streamState.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          firstNestedRenderSpy(isEven);

          return isEven
            ? createElement(SecondNestedConditional, { streamState })
            : createElement("div", {
                children: "first nested odd",
              });
        }
      );
    }

    function SecondNestedConditional({
      streamState,
    }: {
      streamState: State<{ value: number }>;
    }) {
      return streamState.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          secondNestedRenderSpy(isEven);

          return isEven
            ? createElement("div", {
                "data-testid": "leaf-even",
                children: "leaf even",
              })
            : createElement("div", {
                children: "second nested odd",
              });
        }
      );
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(await screen.findByTestId("leaf-even")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(1);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(1);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));

    expect(await screen.findByTestId("top-level-odd")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(2);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(1);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));

    expect(await screen.findByTestId("leaf-even")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(3);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(2);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(2);

    await user.click(screen.getByTestId("button"));

    expect(await screen.findByTestId("top-level-odd")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(4);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(2);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(2);
  });

  test("unsubscribes from updates if wasn't mounted", async () => {
    const user = userEvent.setup();
    const valueState = createState(0);
    function App() {
      const showState = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.update((value) => !value),
          }),
          showState.render((shouldShow) =>
            shouldShow ? createElement(NestedComponent) : null
          ),
        ],
      });
    }

    const spyFn = vi.fn();
    function NestedComponent() {
      const x = createElement("div", {
        children: [
          valueState.render((value) => {
            spyFn();
            return `value is ${value}`;
          }),
        ],
      });
      const showState = createState(false);
      return createElement("div", {
        children: [
          createElement("h1", { children: "nested component" }),
          createElement("button", {
            "data-testid": "nestedButton",
            onClick: () => showState.update((value) => !value),
          }),
          showState.render((shouldShow) => (shouldShow ? x : null)),
        ],
      });
    }

    attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    valueState.set(1);
    // it only was called one time, but it does not track because it is not mounted
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));

    valueState.set(2);
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));
    expect(spyFn).toHaveBeenCalledTimes(2);
    valueState.set(3);
    expect(spyFn).toHaveBeenCalledTimes(2);

    await user.click(screen.getByTestId("nestedButton"));
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(await screen.findByText("value is 3")).toBeVisible();

    await user.click(screen.getByTestId("nestedButton"));
    valueState.set(4);
    await user.click(screen.getByTestId("nestedButton"));
    expect(spyFn).toHaveBeenCalledTimes(4);
    expect(await screen.findByText("value is 4")).toBeVisible();
  });
});
