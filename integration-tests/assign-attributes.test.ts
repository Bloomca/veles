import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState, createRef } from "../src";

describe("assign-attributes", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("updates the live input value when a reactive value changes", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const name$ = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "resetButton",
            onClick: () => name$.set(""),
          }),
          createElement("input", {
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: name$.attribute(),
            onInput: (e) => name$.set((e.target as HTMLInputElement).value),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const btn = screen.getByTestId("resetButton");
    const input = screen.getByTestId("nameInput") as HTMLInputElement;

    await user.type(input, "Veles");
    expect(input).toHaveValue("Veles");

    await user.click(btn);
    expect(input).toHaveValue("");
  });

  test("updates the live textarea value when a reactive value changes", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const bio$ = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "resetButton",
            onClick: () => bio$.set(""),
          }),
          createElement("textarea", {
            "data-testid": "bioInput",
            name: "bio",
            value: bio$.attribute(),
            onInput: (e) => bio$.set((e.target as HTMLTextAreaElement).value),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const btn = screen.getByTestId("resetButton");
    const textarea = screen.getByTestId("bioInput") as HTMLTextAreaElement;

    await user.type(textarea, "Veles textarea");
    expect(textarea).toHaveValue("Veles textarea");

    await user.click(btn);
    expect(textarea).toHaveValue("");
  });

  test("updates the live select value when a reactive value changes", async () => {
    const user = userEvent.setup();

    function StateComponent() {
      const difficulty$ = createState("easy");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "resetButton",
            onClick: () => difficulty$.set("easy"),
          }),
          createElement("select", {
            "data-testid": "difficultySelect",
            name: "difficulty",
            value: difficulty$.attribute(),
            onChange: (e) => difficulty$.set((e.target as HTMLSelectElement).value),
            children: [
              createElement("option", { value: "easy", children: "Easy" }),
              createElement("option", { value: "normal", children: "Normal" }),
              createElement("option", { value: "hard", children: "Hard" }),
            ],
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    const btn = screen.getByTestId("resetButton");
    const select = screen.getByTestId("difficultySelect") as HTMLSelectElement;

    expect(select).toHaveValue("easy");

    await user.selectOptions(select, "hard");
    expect(select).toHaveValue("hard");

    await user.click(btn);
    expect(select).toHaveValue("easy");
  });

  // basic test to make sure event handlers are supported
  test("supports state updates", async () => {
    const user = userEvent.setup();
    const focusFn = vi.fn();
    const blurFn = vi.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const name$ = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              name$.update(() => "");
              inputRef.current?.focus();
            },
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: name$.attribute((name) => name),
            onFocus: focusFn,
            onBlur: blurFn,
            onInput: (e) => name$.set((e.target as HTMLInputElement).value),
          }),
          name$.render((value) =>
            createElement("div", {
              children: [`current name is ${value || "empty"}`],
            }),
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current name is empty")).toBeVisible();
    const btn = screen.getByTestId("button");
    const input = screen.getByTestId("nameInput");
    expect(focusFn).not.toHaveBeenCalled();
    await user.click(btn);
    expect(input).toHaveFocus();
    expect(focusFn).toHaveBeenCalledTimes(1);
    await user.type(input, "Veles");
    expect(await screen.findByText("current name is Veles")).toBeVisible();
    expect(blurFn).not.toHaveBeenCalled();
    await user.keyboard("{Tab}");
    expect(blurFn).toHaveBeenCalledTimes(1);

    await user.click(btn);
    expect(input).toHaveFocus();
    expect(await screen.findByText("current name is empty")).toBeVisible();
  });

  test("supports assigning attributes directly without a callback", async () => {
    const user = userEvent.setup();
    const focusFn = vi.fn();
    const blurFn = vi.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const name$ = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              name$.update(() => "");
              inputRef.current?.focus();
            },
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: name$.attribute(),
            onFocus: focusFn,
            onBlur: blurFn,
            onInput: (e) => name$.set((e.target as HTMLInputElement).value),
          }),
          name$.render((value) =>
            createElement("div", {
              children: [`current name is ${value || "empty"}`],
            }),
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(await screen.findByText("current name is empty")).toBeVisible();
    const btn = screen.getByTestId("button");
    const input = screen.getByTestId("nameInput");
    expect(focusFn).not.toHaveBeenCalled();
    await user.click(btn);
    expect(input).toHaveFocus();
    expect(focusFn).toHaveBeenCalledTimes(1);
    await user.type(input, "Veles");
    expect(await screen.findByText("current name is Veles")).toBeVisible();
    expect(blurFn).not.toHaveBeenCalled();
    await user.keyboard("{Tab}");
    expect(blurFn).toHaveBeenCalledTimes(1);

    await user.click(btn);
    expect(input).toHaveFocus();
    expect(await screen.findByText("current name is empty")).toBeVisible();
  });

  it("assigns dangerouslySetInnerHTML as HTML content", () => {
    const markup = '<span data-testid="injectedContent"><b>injected</b></span>';

    function App() {
      return createElement("div", {
        "data-testid": "container",
        dangerouslySetInnerHTML: { __html: markup },
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const container = screen.getByTestId("container");
    expect(container.innerHTML).toBe(markup);
    expect(container).not.toHaveAttribute("dangerouslysetinnerhtml");
    expect(screen.getByTestId("injectedContent")).toBeVisible();
  });

  it("maps htmlFor to the for attribute", () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("label", {
            "data-testid": "label",
            htmlFor: "name",
            children: "Name",
          }),
          createElement("input", { id: "name" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const label = screen.getByTestId("label") as HTMLLabelElement;
    expect(label).toHaveAttribute("for", "name");
    expect(label).not.toHaveAttribute("htmlfor");
    expect(label.htmlFor).toBe("name");
  });

  it("stringifies boolean ARIA and data attributes", async () => {
    const user = userEvent.setup();

    function App() {
      const hidden$ = createState(false);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => hidden$.update((hidden) => !hidden),
          }),
          createElement("div", {
            "data-testid": "target",
            "aria-hidden": hidden$.attribute(),
            "data-hidden": hidden$.attribute(),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target");
    const toggleButton = screen.getByTestId("toggleButton");

    expect(target).toHaveAttribute("aria-hidden", "false");
    expect(target).toHaveAttribute("data-hidden", "false");

    await user.click(toggleButton);

    expect(target).toHaveAttribute("aria-hidden", "true");
    expect(target).toHaveAttribute("data-hidden", "true");
  });

  it('assignes empty string to attributes with a "true" value', () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            disabled: true,
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    expect(btn.getAttribute("disabled")).toBe("");
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not assign anything to attributes with a "false" value', () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            disabled: false,
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    expect(btn.getAttribute("disabled")).toBe(null);
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("correctly updates boolean properties with attribute", async () => {
    const user = userEvent.setup();
    function App() {
      const disabled$ = createState(false);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => disabled$.update((value) => !value),
          }),
          createElement("button", {
            "data-testid": "button",
            disabled: disabled$.attribute(),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const testBtn = screen.getByTestId("button");
    const toggleBtn = screen.getByTestId("toggleButton");
    await user.click(toggleBtn);

    expect(testBtn.getAttribute("disabled")).toBe("");
    expect((testBtn as HTMLButtonElement).disabled).toBe(true);

    await user.click(toggleBtn);

    expect(testBtn.getAttribute("disabled")).toBe(null);
    expect((testBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("assigns enumerated attributes from booleans correctly", () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("div", {
            "data-testid": "trueDraggable",
            draggable: true,
          }),
          createElement("div", {
            "data-testid": "falseDraggable",
            draggable: false,
          }),
          createElement("div", {
            "data-testid": "trueTranslate",
            translate: true,
          }),
          createElement("div", {
            "data-testid": "falseTranslate",
            translate: false,
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const trueDraggable = screen.getByTestId("trueDraggable") as HTMLElement;
    const falseDraggable = screen.getByTestId("falseDraggable") as HTMLElement;
    const trueTranslate = screen.getByTestId("trueTranslate");
    const falseTranslate = screen.getByTestId("falseTranslate");

    expect(trueDraggable.getAttribute("draggable")).toBe("true");
    expect(falseDraggable.getAttribute("draggable")).toBe("false");
    expect(trueDraggable.draggable).toBe(true);
    expect(falseDraggable.draggable).toBe(false);

    expect(trueTranslate.getAttribute("translate")).toBe("yes");
    expect(falseTranslate.getAttribute("translate")).toBe("no");
  });

  it("updates enumerated attributes reactively", async () => {
    const user = userEvent.setup();

    function App() {
      const draggable$ = createState(false);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => draggable$.update((value) => !value),
          }),
          createElement("div", {
            "data-testid": "target",
            draggable: draggable$.attribute(),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;
    const toggle = screen.getByTestId("toggleButton");

    expect(target.getAttribute("draggable")).toBe("false");
    expect(target.draggable).toBe(false);

    await user.click(toggle);

    expect(target.getAttribute("draggable")).toBe("true");
    expect(target.draggable).toBe(true);

    await user.click(toggle);

    expect(target.getAttribute("draggable")).toBe("false");
    expect(target.draggable).toBe(false);
  });

  it("allows to assign and remove event listeners dynamically", async () => {
    const user = userEvent.setup();
    const state = createState(0);
    const spyFn = vi.fn();
    function App() {
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: state.attribute((value) =>
              value !== 0 && value < 4
                ? () => {
                    spyFn();
                    state.update((currentValue) => currentValue + 1);
                  }
                : undefined,
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    await user.click(btn);
    await user.click(btn);

    state.set(1);

    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);

    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(state.get()).toBe(4);
  });

  it("allows to assign and remove event listeners dynamically passing the same callback", async () => {
    const user = userEvent.setup();
    const state = createState(0);
    const spyFn = vi.fn();
    function App() {
      const handler = () => {
        spyFn();
        state.update((currentValue) => currentValue + 1);
      };
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: state.attribute((value) => (value !== 0 && value < 4 ? handler : undefined)),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    await user.click(btn);
    await user.click(btn);

    state.set(1);

    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);
    await user.click(btn);

    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(state.get()).toBe(4);
  });

  test("adds listeners with multiple words in them correctly", async () => {
    const user = userEvent.setup();
    const spyFn = vi.fn();
    function App() {
      const handler = () => {
        spyFn();
      };
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onDblClick: handler,
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    await user.dblClick(btn);
    expect(spyFn).toHaveBeenCalledTimes(1);
  });

  it("allows to assign and remove event listeners dynamically passing the same callback with multiple words in event", async () => {
    const user = userEvent.setup();
    const state = createState(0);
    const spyFn = vi.fn();
    function App() {
      const handler = () => {
        spyFn();
        state.update((currentValue) => currentValue + 1);
      };
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onDblClick: state.attribute((value) =>
              value !== 0 && value < 4 ? handler : undefined,
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const btn = screen.getByTestId("button");

    await user.dblClick(btn);
    await user.dblClick(btn);

    state.set(1);

    await user.dblClick(btn);
    await user.dblClick(btn);
    await user.dblClick(btn);
    await user.dblClick(btn);
    await user.dblClick(btn);

    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(state.get()).toBe(4);
  });
});
