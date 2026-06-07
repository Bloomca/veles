import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState } from "../src";

function expectStyleAttributeToBeEmpty(element: HTMLElement) {
  expect(element.getAttribute("style") ?? "").toBe("");
}

describe("assign style attribute", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("applies style as text correctly", () => {
    function App() {
      return createElement("div", {
        "data-testid": "target",
        style: "color: red; background-color: blue;",
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");
    expect(target.style.backgroundColor).toBe("blue");
  });

  it("clears conditional style text correctly", async () => {
    const user = userEvent.setup();

    function App() {
      const hasStyle$ = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => hasStyle$.set(false),
          }),
          createElement("div", {
            "data-testid": "target",
            style: hasStyle$.attribute((hasStyle) =>
              hasStyle ? "color: red; background-color: blue;" : undefined
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");
    expect(target.style.backgroundColor).toBe("blue");

    await user.click(screen.getByTestId("toggleButton"));

    expect(target.style.color).toBe("");
    expect(target.style.backgroundColor).toBe("");
    expectStyleAttributeToBeEmpty(target);
  });

  it("changes style text correctly", async () => {
    const user = userEvent.setup();

    function App() {
      const color$ = createState("red");

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "changeButton",
            onClick: () => color$.set("green"),
          }),
          createElement("div", {
            "data-testid": "target",
            style: color$.attribute((color) => `color: ${color};`),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");

    await user.click(screen.getByTestId("changeButton"));

    expect(target.style.color).toBe("green");
  });

  it("applies style as an object correctly", () => {
    function App() {
      return createElement("div", {
        "data-testid": "target",
        style: {
          color: "red",
          "background-color": "blue",
        },
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");
    expect(target.style.backgroundColor).toBe("blue");
  });

  it("clears conditional style object correctly", async () => {
    const user = userEvent.setup();

    function App() {
      const hasStyle$ = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "toggleButton",
            onClick: () => hasStyle$.set(false),
          }),
          createElement("div", {
            "data-testid": "target",
            style: hasStyle$.attribute((hasStyle) =>
              hasStyle
                ? {
                    color: "red",
                    "background-color": "blue",
                  }
                : undefined
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");
    expect(target.style.backgroundColor).toBe("blue");

    await user.click(screen.getByTestId("toggleButton"));

    expect(target.style.color).toBe("");
    expect(target.style.backgroundColor).toBe("");
    expectStyleAttributeToBeEmpty(target);
  });

  it("clears stale object style keys and applies new keys", async () => {
    const user = userEvent.setup();

    function App() {
      const styleVariant$ = createState<"first" | "second">("first");

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "changeButton",
            onClick: () => styleVariant$.set("second"),
          }),
          createElement("div", {
            "data-testid": "target",
            style: styleVariant$.attribute((variant) =>
              variant === "first"
                ? {
                    color: "red",
                    "background-color": "blue",
                  }
                : {
                    "border-color": "green",
                    "margin-top": "4px",
                  }
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const target = screen.getByTestId("target") as HTMLElement;

    expect(target.style.color).toBe("red");
    expect(target.style.backgroundColor).toBe("blue");
    expect(target.style.borderColor).toBe("");
    expect(target.style.marginTop).toBe("");

    await user.click(screen.getByTestId("changeButton"));

    expect(target.style.color).toBe("");
    expect(target.style.backgroundColor).toBe("");
    expect(target.style.borderColor).toBe("green");
    expect(target.style.marginTop).toBe("4px");
  });
});
