import { screen } from "@testing-library/dom";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
  Fragment,
} from "../src";

describe("attachComponent", () => {
  test("attaches component tree correctly", () => {
    const removeVelesTree = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "attachedComponent",
        children: ["test"],
      }),
    });

    const docElement = screen.getByTestId("attachedComponent");
    expect(docElement).toBeVisible();

    removeVelesTree();
  });

  test("calls all onUnmount callbacks when removing tree", () => {
    const appUnmountSpy = jest.fn();
    function App() {
      onUnmount(appUnmountSpy);

      return createElement("div", {
        children: [
          createElement(Fragment, {
            children: [createElement(Child), createElement(Child)],
          }),
        ],
      });
    }
    const state = createState(0);
    const childUnmountSpy = jest.fn();
    const childSubscriptionSpy = jest.fn();
    function Child() {
      onUnmount(childUnmountSpy);
      state.trackValue(childSubscriptionSpy, { skipFirstCall: true });
      return createElement("div", {
        children: "test",
      });
    }
    const removeVelesTree = attachComponent({
      htmlElement: document.body,
      component: createElement("div", {
        "data-testid": "attachedComponent",
        children: [createElement(App)],
      }),
    });

    state.setValue(1);
    expect(childSubscriptionSpy).toHaveBeenCalledTimes(2);

    removeVelesTree();
    expect(appUnmountSpy).toHaveBeenCalledTimes(1);
    expect(childUnmountSpy).toHaveBeenCalledTimes(2);

    state.setValue(2);
    // subscriptions were removed, so no more calls
    expect(childSubscriptionSpy).toHaveBeenCalledTimes(2);
  });
});
