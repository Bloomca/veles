import {
  attachComponent,
  createElement,
  createState,
  Portal,
  Fragment,
} from "../src";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

describe("portals", () => {
  let cleanup: Function | undefined;

  const appContainer = document.createElement("div");
  appContainer.setAttribute("data-testid", "app");
  const portalContainer = document.createElement("div");
  portalContainer.setAttribute("data-testid", "portal");
  document.body.append(appContainer, portalContainer);

  // technically, each test asserts that the portal container is empty
  // but if a test fails, it won't execute the rest and it won't get cleared
  // so we need this to help debugging
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  function checkCleanup() {
    cleanup?.();
    cleanup = undefined;

    expect(portalContainer).toBeEmptyDOMElement();
  }

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
    expect(screen.getByTestId("portal").textContent).toBe(
      "portal titleportal container"
    );

    checkCleanup();
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

    checkCleanup();
  });

  test("it can render several Portals to the same node", () => {
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
              createElement("h2", { children: "first portal title" }),
              createElement("div", { children: "first portal container" }),
            ],
          }),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "second portal title" }),
              createElement("div", { children: "second portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "first portal titlefirst portal containersecond portal titlesecond portal container"
    );

    checkCleanup();
  });

  test("removing one of the Portals does not affect other Portals content", async () => {
    const showFirstPortalState = createState(true);
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
          showFirstPortalState.useValue((shouldShow) =>
            shouldShow
              ? createElement(Portal, {
                  portalNode: portalContainer,
                  children: [
                    createElement("h2", { children: "first portal title" }),
                    createElement("div", {
                      children: "first portal container",
                    }),
                  ],
                })
              : null
          ),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "second portal title" }),
              createElement("div", { children: "second portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "first portal titlefirst portal containersecond portal titlesecond portal container"
    );

    showFirstPortalState.setValue(false);

    expect(screen.getByTestId("portal").textContent).toBe(
      "second portal titlesecond portal container"
    );

    checkCleanup();
  });

  test("adding one of the Portals does not affect other Portals content", async () => {
    const showFirstPortalState = createState(false);
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
          showFirstPortalState.useValue((shouldShow) =>
            shouldShow
              ? createElement(Portal, {
                  portalNode: portalContainer,
                  children: [
                    createElement("h2", { children: "first portal title" }),
                    createElement("div", {
                      children: "first portal container",
                    }),
                  ],
                })
              : null
          ),
          createElement(Portal, {
            portalNode: portalContainer,
            children: [
              createElement("h2", { children: "second portal title" }),
              createElement("div", { children: "second portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      "second portal titlesecond portal container"
    );

    showFirstPortalState.setValue(true);

    /**
     * This is a know quirk, it will add the content to the end. Technically we have enough info to respect
     * the order in the markup, but I don't think it is particularly important, each Portal content should
     * have its own container. Maybe it will bite us later.
     */
    expect(screen.getByTestId("portal").textContent).toBe(
      "second portal titlesecond portal containerfirst portal titlefirst portal container"
    );

    checkCleanup();
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

    checkCleanup();
  });

  test("it renders primitive types as children in Portal correctly", () => {
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
              1,
              createElement(PortalContent),
              "string content",
              null,
              2,
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
      "portal title1component portal contentstring content2"
    );

    checkCleanup();
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

    checkCleanup();
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

    checkCleanup();
  });

  test("it supports conditional string rendering inside a <Portal> component", async () => {
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
                shouldShow ? "portal content" : null
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

    checkCleanup();
  });

  test("it supports conditional component rendering inside a <Portal> component", async () => {
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
                shouldShow ? createElement(PortalContent) : null
              ),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    function PortalContent() {
      return createElement("div", { children: "portal content" });
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

    checkCleanup();
  });

  test("it supports Fragments in Portal content", () => {
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
              createElement(Fragment, {
                children: [
                  createElement("h3", { children: "portal fragment title" }),
                  "fragment string",
                  1,
                  createElement(FragmentComponent),
                ],
              }),
              createElement("div", { children: "portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    function FragmentComponent() {
      return "fragment component";
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      `portal titleportal fragment titlefragment string1fragment componentportal container`
    );

    checkCleanup();
  });

  test("it supports conditional Fragments in Portal content", () => {
    const fragmentShowState = createState(true);
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
              fragmentShowState.useValue((shouldShow) =>
                shouldShow
                  ? createElement(Fragment, {
                      children: [
                        createElement("h3", {
                          children: "portal fragment title",
                        }),
                        "fragment string",
                        1,
                        createElement(FragmentComponent),
                      ],
                    })
                  : null
              ),
              createElement("div", { children: "portal container" }),
            ],
          }),
          createElement("div", { children: "app content" }),
        ],
      });
    }

    function FragmentComponent() {
      return "fragment component";
    }

    expect(screen.getByTestId("app").textContent).toBe("app titleapp content");
    expect(screen.getByTestId("portal").textContent).toBe(
      `portal titleportal fragment titlefragment string1fragment componentportal container`
    );

    fragmentShowState.setValue(false);
    expect(screen.getByTestId("portal").textContent).toBe(
      `portal titleportal container`
    );

    fragmentShowState.setValue(true);
    expect(screen.getByTestId("portal").textContent).toBe(
      `portal titleportal fragment titlefragment string1fragment componentportal container`
    );

    checkCleanup();
  });
});
