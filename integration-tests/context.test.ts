import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  createContext,
  type State,
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

  test("conditionally rendered components have access to Context", async () => {
    const user = userEvent.setup();
    const exampleContext = createContext<number>();

    function App() {
      const showState = createState(false);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue((value) => !value),
          }),
          showState.useValue((shouldShow) =>
            shouldShow ? createElement(NestedComponent) : null
          ),
        ],
      });
    }

    function NestedComponent() {
      const exampleValue = exampleContext.readContext();
      return createElement("div", {
        "data-testid": "container",
        children: [`value is ${exampleValue}`],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(exampleContext.Provider, {
        value: 7,
        children: createElement(App),
      }),
    });

    await user.click(screen.getByTestId("button"));

    expect(screen.getByTestId("container").textContent).toBe("value is 7");
  });

  it("newly added elements in useValueIterator have access to Context", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string; value: number };
    const item1: Item = { id: 1, text: "first item", value: 1 };
    const item2: Item = { id: 2, text: "second item", value: 2 };
    const item3: Item = { id: 3, text: "third item", value: 3 };

    const exampleContext = createContext<number>();

    const itemsState = createState<Item[]>([item1, item2]);
    function App() {
      return createElement("div", {
        children: [
          createElement("div", {
            "data-testid": "container",
            children: itemsState.useValueIterator<Item>(
              { key: "id" },
              ({ elementState }) => createElement(Item, { elementState })
            ),
          }),
        ],
      });
    }

    function Item({ elementState }: { elementState: State<Item> }) {
      const exampleValue = exampleContext.readContext();

      return createElement("div", {
        children: [
          elementState.useValueSelector((element) => element.text),
          " ",
          elementState.useValueSelector(
            (element) => element.value,
            (value) => String(value * exampleValue)
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(exampleContext.Provider, {
        value: 3,
        children: createElement(App),
      }),
    });

    const listElement = screen.getByTestId("container");
    expect(listElement.childNodes.length).toBe(2);
    expect(listElement.childNodes[0].textContent).toBe("first item 3");
    expect(listElement.childNodes[1].textContent).toBe("second item 6");

    itemsState.setValue([item1, item2, item3]);
    expect(listElement.childNodes.length).toBe(3);
    expect(listElement.childNodes[0].textContent).toBe("first item 3");
    expect(listElement.childNodes[1].textContent).toBe("second item 6");
    expect(listElement.childNodes[2].textContent).toBe("third item 9");
  });

  it("another Context overrides same value for children correctly", () => {
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
        children: [
          createElement("div", {
            "data-testid": "contextContent",
            children: `context value is ${exampleValue}`,
          }),
          createElement(exampleContext.Provider, {
            value: 6,
            children: createElement(DoubleNestedComponent),
          }),
        ],
      });
    }

    function DoubleNestedComponent() {
      const exampleValue = exampleContext.readContext();

      return createElement("div", {
        "data-testid": "doubleContextContent",
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
    expect(screen.getByTestId("doubleContextContent").textContent).toBe(
      "context value is 6"
    );
  });
});
