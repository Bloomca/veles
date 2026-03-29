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
      const value$ = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              value$.update((currentValue) => currentValue + 1);
            },
          }),
          value$.render((value) =>
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
      const name$ = createState("");
      return createElement("div", {
        children: [
          createElement("input", {
            "data-testid": "nameInput",
            onInput: (e) => {
              name$.set(e.target.value);
            },
          }),
          name$.render((value) =>
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
      const value$ = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              value$.update((currentValue) => currentValue + 1);
            },
          }),
          createElement(ReadingStateComponent, {
            value$,
          }),
        ],
      });
    }

    function ReadingStateComponent({
      value$,
    }: {
      value$: State<number>;
    }) {
      return createElement("div", {
        children: [
          value$.render((value) =>
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
      const value$ = createState({
        firstValue: 0,
        secondValue: 0,
      });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "firstValueButton",
            onClick: () => {
              value$.update((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              value$.update((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          value$.renderSelected(
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
      const value$ = createState({
        firstValue: 0,
        secondValue: 0,
      });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "firstValueButton",
            onClick: () => {
              value$.update((currentValue) => ({
                ...currentValue,
                firstValue: currentValue.firstValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "secondValueButton",
            onClick: () => {
              value$.update((currentValue) => ({
                ...currentValue,
                secondValue: currentValue.secondValue + 1,
              }));
            },
          }),
          createElement("button", {
            "data-testid": "fakeValueButton",
            onClick: () => {
              value$.update((currentValue) => ({
                ...currentValue,
              }));
            },
          }),
          value$.render(
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
      const value$ = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              value$.update((currentValue) => currentValue + 1);
            },
          }),
          createElement("div", {
            children: value$.render(
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
      const value$ = createState(0);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              value$.update((currentValue) => currentValue + 1);
            },
          }),
          createElement("div", {
            children: value$.render((value) =>
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
      const title$ = createState("title");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              title$.set("new title");
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: title$.render(),
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
      const title$ = createState({ title: "title" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              title$.set({ title: "new title" });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: title$.renderSelected((data) => data.title),
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
      const title$ = createState({ title: "title" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              title$.set({ title: newValue });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: title$.renderSelected(
              (data) => data.title.length > 3,
              (isLong) =>
                isLong
                  ? createElement(ConditionalComponent, { state: title$ })
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
      const title$ = createState({ title: "" });
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              title$.set({ title: newValue });
            },
          }),
          createElement("div", {
            "data-testid": "container",
            children: title$.renderSelected(
              (data) => data.title.length > 3,
              (isLong) =>
                isLong
                  ? createElement(ConditionalComponent, { state: title$ })
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
      const stream$ = createState({ value: 0 });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () =>
              stream$.update((value) => ({
                value: value.value + 1,
              })),
          }),
          createElement(TopLevelConditional, { stream$ }),
        ],
      });
    }

    function TopLevelConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          topLevelRenderSpy(isEven);

          return isEven
            ? createElement(FirstNestedConditional, { stream$ })
            : createElement("div", {
                "data-testid": "top-level-odd",
                children: "top level odd",
              });
        }
      );
    }

    function FirstNestedConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          firstNestedRenderSpy(isEven);

          return isEven
            ? createElement(SecondNestedConditional, { stream$ })
            : createElement("div", {
                children: "first nested odd",
              });
        }
      );
    }

    function SecondNestedConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
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

  test("executes parent and nested callbacks when parent changes but children stay mounted", async () => {
    const user = userEvent.setup();

    const topLevelRenderSpy = vi.fn();
    const firstNestedRenderSpy = vi.fn();
    const secondNestedRenderSpy = vi.fn();

    function App() {
      const stream$ = createState({ value: 0 });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () =>
              stream$.update((value) => ({
                value: value.value + 1,
              })),
          }),
          createElement(TopLevelConditional, { stream$ }),
        ],
      });
    }

    function TopLevelConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          topLevelRenderSpy(isEven);

          return createElement("div", {
            "data-testid": "top-level",
            children: [
              `top level is ${isEven ? "even" : "odd"}`,
              createElement(FirstNestedConditional, { stream$ }),
            ],
          });
        }
      );
    }

    function FirstNestedConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          firstNestedRenderSpy(isEven);

          return createElement("div", {
            "data-testid": "first-nested",
            children: [
              `first nested is ${isEven ? "even" : "odd"}`,
              createElement(SecondNestedConditional, { stream$ }),
            ],
          });
        }
      );
    }

    function SecondNestedConditional({
      stream$,
    }: {
      stream$: State<{ value: number }>;
    }) {
      return stream$.renderSelected(
        (value) => value.value % 2 === 0,
        (isEven) => {
          secondNestedRenderSpy(isEven);

          return createElement("div", {
            "data-testid": "leaf",
            children: `leaf is ${isEven ? "even" : "odd"}`,
          });
        }
      );
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(await screen.findByText("top level is even")).toBeVisible();
    expect(await screen.findByText("first nested is even")).toBeVisible();
    expect(await screen.findByText("leaf is even")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(1);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(1);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));

    expect(await screen.findByText("top level is odd")).toBeVisible();
    expect(await screen.findByText("first nested is odd")).toBeVisible();
    expect(await screen.findByText("leaf is odd")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(2);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(2);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(2);

    await user.click(screen.getByTestId("button"));

    expect(await screen.findByText("top level is even")).toBeVisible();
    expect(await screen.findByText("first nested is even")).toBeVisible();
    expect(await screen.findByText("leaf is even")).toBeVisible();
    expect(topLevelRenderSpy).toHaveBeenCalledTimes(3);
    expect(firstNestedRenderSpy).toHaveBeenCalledTimes(3);
    expect(secondNestedRenderSpy).toHaveBeenCalledTimes(3);
  });

  test("does not execute pre-created conditional markup before mount", async () => {
    const user = userEvent.setup();
    const componentExecutionSpy = vi.fn();

    function HeavyComponent() {
      componentExecutionSpy();

      return createElement("div", {
        "data-testid": "heavy-component",
        children: "heavy component",
      });
    }

    function App() {
      const show$ = createState(false);
      const heavyMarkup = createElement(HeavyComponent);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => show$.set(true),
          }),
          show$.render((shouldShow) => (shouldShow ? heavyMarkup : null)),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(componentExecutionSpy).toHaveBeenCalledTimes(0);
    expect(screen.queryByTestId("heavy-component")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("button"));

    expect(componentExecutionSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByTestId("heavy-component")).toBeVisible();
  });

  test("unsubscribes from updates if wasn't mounted", async () => {
    const user = userEvent.setup();
    const value$ = createState(0);
    function App() {
      const show$ = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => show$.update((value) => !value),
          }),
          show$.render((shouldShow) =>
            shouldShow ? createElement(NestedComponent) : null
          ),
        ],
      });
    }

    const spyFn = vi.fn();
    function NestedComponent() {
      const x = createElement("div", {
        children: [
          value$.render((value) => {
            spyFn();
            return `value is ${value}`;
          }),
        ],
      });
      const show$ = createState(false);
      return createElement("div", {
        children: [
          createElement("h1", { children: "nested component" }),
          createElement("button", {
            "data-testid": "nestedButton",
            onClick: () => show$.update((value) => !value),
          }),
          show$.render((shouldShow) => (shouldShow ? x : null)),
        ],
      });
    }

    attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    value$.set(1);
    // it only was called one time, but it does not track because it is not mounted
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));

    value$.set(2);
    expect(spyFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId("button"));
    expect(spyFn).toHaveBeenCalledTimes(2);
    value$.set(3);
    expect(spyFn).toHaveBeenCalledTimes(2);

    await user.click(screen.getByTestId("nestedButton"));
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(await screen.findByText("value is 3")).toBeVisible();

    await user.click(screen.getByTestId("nestedButton"));
    value$.set(4);
    await user.click(screen.getByTestId("nestedButton"));
    expect(spyFn).toHaveBeenCalledTimes(4);
    expect(await screen.findByText("value is 4")).toBeVisible();
  });
});
