import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, Fragment, createState } from "../src";

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
});
