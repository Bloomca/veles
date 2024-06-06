import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, Fragment, createState } from "../src";

describe("<Fragment>", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("supports <Fragment> components rendering correctly", () => {
    function App() {
      return createElement("div", {
        children: [
          createElement("span", { children: "first child" }),
          createElement(Fragment, {
            children: [
              createElement("div", { children: "First Fragment child" }),
              createElement("p", { children: "Second Fragment child" }),
            ],
          }),
          createElement("div", { children: "last child" }),
          createElement("hr"),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // right now attaching wraps the app into another <div>
    expect(document.body.innerHTML).toEqual(
      `
      <div>
        <div>
          <span>first child</span>
          <div>First Fragment child</div>
          <p>Second Fragment child</p>
          <div>last child</div>
          <hr>
        </div>
      </div>
    `
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .join("")
    );
  });

  test("supports updating children in <Fragment> components correctly", async () => {
    const user = userEvent.setup();
    function App() {
      const state = createState(0);
      return createElement("div", {
        children: [
          createElement("span", { children: "first child" }),
          createElement(Fragment, {
            children: [
              createElement("div", { children: "First Fragment child" }),
              state.useValue((currentValue) =>
                createElement("div", {
                  "data-testid": "fragment-dynamic-element",
                  children: `Second Fragment value: ${currentValue}`,
                })
              ),
              createElement("p", { children: "Third Fragment child" }),
            ],
          }),
          createElement("button", {
            "data-testid": "button",
            onClick: () => state.setValue((currentValue) => currentValue + 1),
          }),
          createElement("div", { children: "last child" }),
          createElement("hr"),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    await user.click(screen.getByTestId("button"));
    expect(screen.getByTestId("fragment-dynamic-element")).toHaveTextContent(
      "Second Fragment value: 1"
    );

    await user.click(screen.getByTestId("button"));
    expect(screen.getByTestId("fragment-dynamic-element")).toHaveTextContent(
      "Second Fragment value: 2"
    );

    // right now attaching wraps the app into another <div>
    expect(document.body.innerHTML).toEqual(
      `
      <div>
        <div>
          <span>first child</span>
          <div>First Fragment child</div>
          <div data-testid="fragment-dynamic-element">Second Fragment value: 2</div>
          <p>Third Fragment child</p>
          <button data-testid="button"></button>
          <div>last child</div>
          <hr>
        </div>
      </div>
    `
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .join("")
    );
  });

  test("supports returning a <Fragment> from a component with static content", () => {
    function App() {
      return createElement("div", {
        "data-testid": "container",
        children: createElement(FragmentComponent),
      });
    }

    function FragmentComponent() {
      return createElement(Fragment, {
        children: [
          createElement("div", { children: "first element" }),
          createElement("div", { children: "second element" }),
          createElement("div", { children: "third element" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const containerElement = screen.getByTestId("container");
    const children = containerElement.childNodes;

    expect(children.length).toBe(3);
    expect(children[0].textContent).toBe("first element");
    expect(children[1].textContent).toBe("second element");
    expect(children[2].textContent).toBe("third element");
  });

  test("support returning a Fragment from a component rendered conditionally", async () => {
    const user = userEvent.setup();
    function App() {
      const showState = createState(false);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue(true),
          }),
          createElement("div", {
            "data-testid": "container",
            children: showState.useValue((shouldShow) =>
              shouldShow ? createElement(FragmentComponent) : null
            ),
          }),
        ],
      });
    }

    function FragmentComponent() {
      return createElement(Fragment, {
        children: [
          createElement("div", { children: "first element" }),
          createElement("div", { children: "second element" }),
          createElement("div", { children: "third element" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    await user.click(screen.getByTestId("button"));
    const containerElement = screen.getByTestId("container");
    const children = containerElement.childNodes;

    expect(children.length).toBe(3);
    expect(children[0].textContent).toBe("first element");
    expect(children[1].textContent).toBe("second element");
    expect(children[2].textContent).toBe("third element");
  });

  test("support returning a Fragment from useValue and then switching to a regular node conditionally", async () => {
    const user = userEvent.setup();
    function App() {
      const showState = createState(true);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue(false),
          }),
          createElement("div", {
            "data-testid": "container",
            children: showState.useValue((shouldShow) =>
              shouldShow
                ? createElement(FragmentComponent)
                : createElement(RegularComponent)
            ),
          }),
        ],
      });
    }

    function FragmentComponent() {
      return createElement(Fragment, {
        children: [
          createElement("div", { children: "first element" }),
          createElement("div", { children: "second element" }),
          createElement("div", { children: "third element" }),
        ],
      });
    }

    function RegularComponent() {
      return createElement("div", {
        children: "Regular element",
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const containerElement = screen.getByTestId("container");
    const children = containerElement.childNodes;

    expect(children.length).toBe(3);
    expect(children[0].textContent).toBe("first element");
    expect(children[1].textContent).toBe("second element");
    expect(children[2].textContent).toBe("third element");

    await user.click(screen.getByTestId("button"));
    expect(children.length).toBe(1);
    expect(children[0].textContent).toBe("Regular element");
  });

  test("support returning a Fragment from useValue and then switching to another Fragment conditionally", async () => {
    const user = userEvent.setup();
    function App() {
      const showState = createState(true);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue(false),
          }),
          createElement("div", {
            "data-testid": "container",
            children: showState.useValue((shouldShow) =>
              shouldShow
                ? createElement(FragmentComponent)
                : createElement(FragmentComponent2)
            ),
          }),
        ],
      });
    }

    function FragmentComponent() {
      return createElement(Fragment, {
        children: [
          createElement("div", { children: "first element" }),
          createElement("div", { children: "second element" }),
          createElement("div", { children: "third element" }),
        ],
      });
    }

    function FragmentComponent2() {
      return createElement(Fragment, {
        children: [
          createElement("div", { children: "fourth element" }),
          createElement("div", { children: "fifth element" }),
          createElement("div", { children: "sixth element" }),
          createElement("div", { children: "seventh element" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const containerElement = screen.getByTestId("container");
    const children = containerElement.childNodes;

    expect(children.length).toBe(3);
    expect(children[0].textContent).toBe("first element");
    expect(children[1].textContent).toBe("second element");
    expect(children[2].textContent).toBe("third element");

    await user.click(screen.getByTestId("button"));
    expect(children.length).toBe(4);
    expect(children[0].textContent).toBe("fourth element");
    expect(children[1].textContent).toBe("fifth element");
    expect(children[2].textContent).toBe("sixth element");
    expect(children[3].textContent).toBe("seventh element");
  });
});
