import { attachComponent, createElement, createState, Portal } from "../src";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

describe("portals", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  const appContainer = document.createElement("div");
  appContainer.setAttribute("data-testid", "app");
  const portalContainer = document.createElement("div");
  portalContainer.setAttribute("data-testid", "portal");
  document.body.append(appContainer, portalContainer);

  test("can render portal directly", () => {
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement("div", {
            portal: portalContainer,
            children: [
              createElement("h2", { children: "portal title" }),
              createElement("div", { children: "portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    // expect(screen.getByTestId("portal").textContent).toBe(
    //   "portal titleportal container"
    // );
  });

  test("can render portal using <Portal> component", () => {
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "portal title" }),
              createElement("div", { children: "portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titleportal container"
    );
  });

  test("it removes portal content correctly if the Veles app is detached", () => {
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "portal title" }),
              createElement("div", { children: "portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titleportal container"
    );

    cleanup();
    cleanup = undefined;

    expect(screen.getByTestId("portal")).toBeEmptyDOMElement();
  });

  test("it renders components correctly in Portal content", () => {
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "portal title" }),
              createElement(PortalContent),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    function PortalContent() {
      return createElement("div", { children: "component portal content" });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titlecomponent portal content"
    );
  });

  test("it supports conditional rendering of a <Portal> component", async () => {
    const user = userEvent.setup();
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      const showPortalState = createState(true);
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement("button", {
            children: "toggle menu",
            onClick: () =>
              showPortalState.setValue((currentValue) => !currentValue),
          }),
          showPortalState.useValue((shouldShow) =>
            shouldShow
              ? createElement(Portal, {
                  portalNode: portalContainer,
                  children: [
                    createElement("h2", { children: "portal title" }),
                    createElement("div", { children: "portal content" }),
                  ],
                })
              : null
          ),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titleportal content"
    );

    // hide the menu
    await user.click(screen.getByRole("button", { name: "toggle menu" }));
    expect(screen.getByTestId("portal")).toBeEmptyDOMElement();

    // show the menu again
    await user.click(screen.getByRole("button", { name: "toggle menu" }));
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titleportal content"
    );
  });

  test("it supports conditional rendering inside a <Portal> component", async () => {
    const user = userEvent.setup();
    cleanup = attachComponent({
      htmlElement: appContainer,
      component: createElement("div", {
        children: createElement(Application),
      }),
    });

    function Application() {
      const showContentState = createState(false);
      return createElement("div", {
        children: [
          createElement("h1", { children: ["app title"] }),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "portal title" }),
              createElement("button", {
                children: "toggle content",
                onClick: () =>
                  showContentState.setValue((currentValue) => !currentValue),
              }),
              showContentState.useValue((shouldShow) =>
                shouldShow
                  ? createElement("div", { children: "portal content" })
                  : null
              ),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titletoggle content"
    );

    await user.click(screen.getByRole("button", { name: "toggle content" }));
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titletoggle contentportal content"
    );

    await user.click(screen.getByRole("button", { name: "toggle content" }));
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titletoggle content"
    );
  });
});
