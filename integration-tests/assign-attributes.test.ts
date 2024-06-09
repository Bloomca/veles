import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState, createRef } from "../src";

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

  // basic test to make sure event handlers are supported
  test("supports state updates", async () => {
    const user = userEvent.setup();
    const focusFn = jest.fn();
    const blurFn = jest.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const nameState = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              nameState.setValue(() => "");
              inputRef.current?.focus();
            },
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: nameState.useAttribute((name) => name),
            onFocus: focusFn,
            onBlur: blurFn,
            onInput: (e) => nameState.setValue(() => e.target.value),
          }),
          nameState.useValue((value) =>
            createElement("div", {
              children: [`current name is ${value || "empty"}`],
            })
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
    const focusFn = jest.fn();
    const blurFn = jest.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const nameState = createState("");
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              nameState.setValue(() => "");
              inputRef.current?.focus();
            },
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: nameState.useAttribute(),
            onFocus: focusFn,
            onBlur: blurFn,
            onInput: (e) => nameState.setValue(e.target.value),
          }),
          nameState.useValue((value) =>
            createElement("div", {
              children: [`current name is ${value || "empty"}`],
            })
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

  it("correctly updates boolean properties with useAttribute", async () => {
    const user = userEvent.setup();
    function App() {
      const disabledState = createState(false);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => disabledState.setValue((value) => !value),
          }),
          createElement("button", {
            "data-testid": "button",
            disabled: disabledState.useAttribute(),
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
});
