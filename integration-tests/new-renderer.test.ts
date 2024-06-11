import { attachComponent } from "../src/attach-component";
import { createElement } from "../src/create-element";
import { Fragment } from "../src/fragment";
import { screen } from "@testing-library/dom";

describe("new renderer engine", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("can render simple markup", () => {
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "app",
        children: ["application"],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
  });

  test("can render components", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        children: [createElement(App)],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
  });

  test("can render components alongside regular nodes when it is first", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    function App2() {
      return createElement("div", {
        "data-testid": "app2",
        children: ["something"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(App),
          createElement(App2),
          createElement("div", { children: "hello" }),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "applicationsomethinghello"
    );
  });

  test("can render components alongside regular nodes when it is in the middle", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement("div", { children: "hello" }),
          " ",
          createElement(App),
          " ",
          createElement("div", { children: "goodbye" }),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello application goodbye"
    );
  });

  test("can render components alongside regular nodes when it is in the end", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement("div", { children: "hello" }),
          ",",
          createElement("div", { children: "goodbye " }),
          createElement(App),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,goodbye application"
    );
  });

  test("can render components alongside Fragment nodes when it is first", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(App),
          createElement(Fragment, { children: ["hello", ","] }),
          createElement("div", { children: "goodbye" }),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "applicationhello,goodbye"
    );
  });

  test("can render components alongside Fragment nodes when it is in the middle", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App),
          createElement("div", { children: "goodbye" }),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,applicationgoodbye"
    );
  });

  test("can render components alongside Fragment nodes when it is in the end", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,application"
    );
  });

  it("can render nested components", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application", createElement(NestedComponent)],
      });
    }
    function NestedComponent() {
      return createElement("div", {
        "data-testid": "nested",
        children: ["nested text"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App),
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe(
      "applicationnested text"
    );
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,applicationnested text"
    );
  });

  it("can render multiple nested components without regular node wrappers", () => {
    function App() {
      return createElement(NestedComponent);
    }
    function NestedComponent() {
      return createElement("div", {
        "data-testid": "nested",
        children: ["nested text"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App),
        ],
      }),
    });

    expect(screen.getByTestId("nested").textContent).toBe("nested text");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,nested text"
    );
  });

  it("can render nested components returning Fragment directly", () => {
    function App() {
      return createElement(NestedComponent);
    }
    function NestedComponent() {
      return createElement(Fragment, {
        children: [
          "nested text",
          createElement("div", { children: "something" }),
        ],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App),
        ],
      }),
    });

    expect(screen.getByTestId("container").textContent).toBe(
      "hello,nested textsomething"
    );
  });

  it("supports passing down props", () => {
    function App({ value }: { value: number }) {
      return createElement(NestedComponent, { value });
    }
    function NestedComponent({ value }: { value: number }) {
      return createElement(Fragment, {
        children: [
          "nested text",
          createElement("div", { children: "something" }),
          `value is ${value}`,
        ],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, { children: ["hello", ","] }),
          createElement(App, { value: 5 }),
        ],
      }),
    });

    expect(screen.getByTestId("container").textContent).toBe(
      "hello,nested textsomethingvalue is 5"
    );
  });

  test("supports components inside Fragment at the end", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, {
            children: ["hello", ",", createElement(App)],
          }),
          "test",
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "hello,applicationtest"
    );
  });

  test("supports components inside Fragment in the beginning", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, {
            children: [createElement(App), "hello", ","],
          }),
          "test",
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("container").textContent).toBe(
      "applicationhello,test"
    );
  });

  test("supports components inside Fragment in the middle", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: ["application"],
      });
    }
    function AnotherApp() {
      return createElement("div", {
        "data-testid": "app2",
        children: ["another line"],
      });
    }
    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "container",
        children: [
          createElement(Fragment, {
            children: [
              "hello",
              createElement(App),
              createElement(AnotherApp),
              ",",
            ],
          }),
          "test",
        ],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe("application");
    expect(screen.getByTestId("app2").textContent).toBe("another line");
    expect(screen.getByTestId("container").textContent).toBe(
      "helloapplicationanother line,test"
    );
  });

  test("supports several components as children", () => {
    function App() {
      return createElement("div", {
        "data-testid": "app",
        children: [
          createElement(FirstComponent),
          createElement(SecondComponent),
          createElement(ThirdComponent),
        ],
      });
    }

    function FirstComponent() {
      return createElement("div", {
        children: "first component",
      });
    }
    function SecondComponent() {
      return createElement("div", {
        children: "second component",
      });
    }
    function ThirdComponent() {
      return createElement("div", {
        children: "third component",
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        children: [createElement(App)],
      }),
    });

    expect(screen.getByTestId("app").textContent).toBe(
      "first componentsecond componentthird component"
    );
  });
});
