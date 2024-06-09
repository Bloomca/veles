import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  type State,
} from "../src";

describe("createElement", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });
  test("supports nested components correctly", () => {
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "attachedComponent",
        children: [
          createElement("div", {
            "data-testid": "nestedComponent",
            children: [
              createElement("div", {
                "data-testid": "moreNestedComponent",
              }),
            ],
          }),
        ],
      }),
    });

    expect(screen.getByTestId("nestedComponent")).toBeVisible();
    expect(screen.getByTestId("moreNestedComponent")).toBeVisible();
  });

  test("support function components", async () => {
    function SecondComponent() {
      return createElement("div", {
        children: ["Second component"],
      });
    }

    function FirstComponent() {
      return createElement("div", {
        children: [
          createElement("div", { children: "First component" }),
          createElement(SecondComponent),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(FirstComponent),
    });

    expect(await screen.findByText("First component")).toBeVisible();
    expect(await screen.findByText("Second component")).toBeVisible();
  });

  test("supports passing down props correctly", async () => {
    function SecondComponent({ value }: { value: string }) {
      return createElement("div", {
        children: [
          "Second component",
          createElement("span", { children: value }),
        ],
      });
    }

    function FirstComponent() {
      return createElement("div", {
        children: [
          createElement("div", { children: "First component" }),
          createElement(SecondComponent, { value: "Nested propery" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(FirstComponent),
    });

    expect(await screen.findByText("Nested propery")).toBeVisible();
  });

  test("supports returning string from a component", async () => {
    function StringComponent() {
      return "hello, world";
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StringComponent),
    });

    expect(await screen.findByText("hello, world")).toBeVisible();
  });

  test("support returning a string from a nested component", async () => {
    function StringComponent() {
      return "hello, world";
    }
    function App() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["parent component"] }),
          createElement(StringComponent),
        ],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(await screen.findByText("parent component")).toBeVisible();
    expect(await screen.findByText("hello, world")).toBeVisible();
  });

  test("support returning null from a component", async () => {
    function StringComponent() {
      return null;
    }
    function App() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["parent component"] }),
          createElement(StringComponent),
        ],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(await screen.findByText("parent component")).toBeVisible();
  });

  test("support numbers as a children element", async () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["parent component"] }),
          createElement("div", {
            "data-testid": "container",
            children: ["text ", 5],
          }),
        ],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(screen.getByTestId("container").textContent).toBe("text 5");
  });

  test("support returning useValue directly from a component", async () => {
    const user = userEvent.setup();
    function App() {
      const showState = createState(false);
      return createElement("div", {
        children: [
          createElement("h1", { children: ["parent component"] }),
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue(true),
          }),
          createElement(StateComponent, { showState }),
        ],
      });
    }

    function StateComponent({ showState }: { showState: State<boolean> }) {
      return showState.useValue((shouldShowState) =>
        shouldShowState
          ? createElement("div", {
              "data-testid": "stateComponent",
              children: "state component",
            })
          : null
      );
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(screen.queryByTestId("stateComponent")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("button"));
    expect(screen.getByTestId("stateComponent")).toBeInTheDocument();
  });
});
