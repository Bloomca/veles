import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  createRef,
  createContext,
} from "../src";

describe("Context", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("nested components have access to the Context", () => {
    const exampleContext = createContext<number>();

    function App() {
      return createElement("div", {
        children: [
          createElement("h1", { children: "Application" }),
          createElement(NestedComponent),
        ],
      });
    }

    function NestedComponent() {
      const exampleValue = exampleContext.readContext();

      return createElement("div", {
        "data-testid": "contextContent",
        children: `context value is ${exampleValue}`,
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(exampleContext.Provider, {
        value: 5,
        children: createElement(App),
      }),
    });

    expect(screen.getByTestId("contextContent").textContent).toBe(
      "context value is 5"
    );
  });

  test("nested components have access to the Context if added with Context.addContext()", () => {
    const exampleContext = createContext<number>();

    function App() {
      exampleContext.addContext(5);
      return createElement("div", {
        children: [
          createElement("h1", { children: "Application" }),
          createElement(NestedComponent),
        ],
      });
    }

    function NestedComponent() {
      const exampleValue = exampleContext.readContext();

      return createElement("div", {
        "data-testid": "contextContent",
        children: `context value is ${exampleValue}`,
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(screen.getByTestId("contextContent").textContent).toBe(
      "context value is 5"
    );
  });
});
