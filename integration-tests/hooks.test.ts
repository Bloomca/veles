import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
  onMount,
} from "../src";

describe("lifecycle hooks", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("triggers onMount hook on all components in the tree", () => {
    const appMountSpy = jest.fn();
    const firstComponentMountSpy = jest.fn();
    const secondComponentMountSpy = jest.fn();
    function App() {
      onMount(appMountSpy);
      return createElement("div", {
        children: [createElement(FirstNestedComponent)],
      });
    }

    function FirstNestedComponent() {
      onMount(firstComponentMountSpy);
      return createElement("div", {
        children: [
          "first nested component",
          createElement(SecondNestedComponent),
        ],
      });
    }

    function SecondNestedComponent() {
      onMount(secondComponentMountSpy);
      return createElement("div", {
        children: ["second nested component"],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(appMountSpy).toHaveBeenCalledTimes(1);
    expect(firstComponentMountSpy).toHaveBeenCalledTimes(1);
    expect(secondComponentMountSpy).toHaveBeenCalledTimes(1);
  });

  test("triggers onUnmount hook on every nested component which is removed from the tree", async () => {
    const user = userEvent.setup();
    function App() {
      const showChildrenState = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showChildrenState.setValue(() => false),
          }),
          showChildrenState.useValue((shouldShow) => {
            if (shouldShow) {
              return createElement(FirstNestedComponent);
            } else {
              // right now we have to return something
              return createElement("div");
            }
          }),
        ],
      });
    }

    const firstComponentUnmountSpy = jest.fn();
    const secondComponentUnmountSpy = jest.fn();
    function FirstNestedComponent() {
      onUnmount(firstComponentUnmountSpy);
      return createElement("div", {
        children: [
          "first nested component",
          createElement(SecondNestedComponent),
        ],
      });
    }

    function SecondNestedComponent() {
      onUnmount(secondComponentUnmountSpy);
      return createElement("div", {
        children: ["second nested component"],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(firstComponentUnmountSpy).toHaveBeenCalledTimes(0);
    expect(secondComponentUnmountSpy).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByTestId("button"));

    expect(firstComponentUnmountSpy).toHaveBeenCalledTimes(1);
    expect(secondComponentUnmountSpy).toHaveBeenCalledTimes(1);
  });
});
