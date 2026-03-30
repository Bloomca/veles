import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
  onMount,
  type State,
} from "../src";

describe("lifecycle hooks", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("triggers onMount hook on all components in the tree", async () => {
    const appMountSpy = vi.fn();
    const firstComponentMountSpy = vi.fn();
    const secondComponentMountSpy = vi.fn();
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

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(appMountSpy).toHaveBeenCalledTimes(1);
    expect(firstComponentMountSpy).toHaveBeenCalledTimes(1);
    expect(secondComponentMountSpy).toHaveBeenCalledTimes(1);
  });

  test("triggers onUnmount hook on every nested component which is removed from the tree", async () => {
    const user = userEvent.setup();
    function App() {
      const showChildren$ = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => showChildren$.set(false),
          }),
          showChildren$.render((shouldShow) =>
            shouldShow ? createElement(FirstNestedComponent) : null
          ),
        ],
      });
    }

    const firstComponentUnmountSpy = vi.fn();
    const secondComponentUnmountSpy = vi.fn();
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

  test("onMount hooks are executed when the markup is in DOM", async () => {
    let isElementFound = false;
    const appMountSpy = () => {
      const appComponentElement = document.querySelector(
        '[data-testid="appComponent"]'
      );

      if (appComponentElement) {
        isElementFound = true;
      }
    };
    function App() {
      onMount(appMountSpy);
      return createElement("div", {
        "data-testid": "appComponent",
        children: ["app component"],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(isElementFound).toBe(true);
  });

  test("onMount hooks are executed when new components are mounted based on state", async () => {
    function App() {
      const show$ = createState(false);
      return createElement("div", {
        "data-testid": "appComponent",
        children: [
          "app component",
          createElement("button", {
            "data-testid": "button",
            onClick: () => show$.update(() => true),
          }),
          show$.render((shouldShow) =>
            shouldShow ? createElement(Wrapper) : null
          ),
        ],
      });
    }

    function Wrapper() {
      return createElement("div", {
        children: ["yo", createElement(ConditionalComponent)],
      });
    }

    const spy = vi.fn();
    function ConditionalComponent() {
      onMount(spy);

      return createElement("div", {
        children: "conditional component",
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(spy).not.toHaveBeenCalled();

    await userEvent.click(screen.getByTestId("button"));

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("onMount is called one time", async () => {
    const appMountSpy = vi.fn();
    function App() {
      onMount(appMountSpy);
      return createElement("div", {
        "data-testid": "appComponent",
        children: ["app component", createElement(FirstComponent)],
      });
    }

    const firstComponentMountSpy = vi.fn();
    function FirstComponent() {
      onMount(firstComponentMountSpy);

      return createElement("div", {
        children: ["test", createElement(SecondComponent)],
      });
    }

    const secondComponentMountSpy = vi.fn();
    function SecondComponent() {
      onMount(secondComponentMountSpy);

      return createElement(ThirdComponent);
    }

    const thirdComponentMountSpy = vi.fn();
    function ThirdComponent() {
      onMount(thirdComponentMountSpy);

      return createElement("div", { children: "test" });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(appMountSpy).toHaveBeenCalledTimes(1);
    expect(firstComponentMountSpy).toHaveBeenCalledTimes(1);
    expect(secondComponentMountSpy).toHaveBeenCalledTimes(1);
    expect(thirdComponentMountSpy).toHaveBeenCalledTimes(1);
  });

  test("onMount is called correctly for iterator values", async () => {
    function App() {
      const tasks$ = createState([
        { id: 1, title: "first task" },
        { id: 2, title: "second task" },
      ]);
      return createElement("div", {
        "data-testid": "appComponent",
        children: [
          "app component",
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              tasks$.update((currentTasks) =>
                currentTasks.concat({ id: 3, title: "third task" })
              );
            },
          }),
          tasks$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
            createElement(Task, { task$: element$ })
          ),
        ],
      });
    }

    const taskMountSpy = vi.fn();
    function Task({
      task$,
    }: {
      task$: State<{ id: number; title: string }>;
    }) {
      onMount(taskMountSpy);
      return createElement("div", {
        children: [
          "task",
          task$.renderSelected(
            (task) => task.title,
            (title) => title
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(taskMountSpy).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByTestId("button"));

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(taskMountSpy).toHaveBeenCalledTimes(3);
  });

  test("onMount returned function is automatically registered as onUnmount", async () => {
    function App() {
      const shouldShow$ = createState(true);
      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => shouldShow$.set(false),
          }),
          shouldShow$.render((shouldShow) =>
            shouldShow ? createElement(ConditionalComponent) : null
          ),
        ],
      });
    }

    const mountSpy = vi.fn();
    const unmountSpy = vi.fn();
    function ConditionalComponent() {
      onMount(() => {
        mountSpy();
        return unmountSpy;
      });
      return createElement("div", {
        children: "conditional",
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(mountSpy).toHaveBeenCalledTimes(1);
    expect(unmountSpy).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId("button"));
    // hacky way to wait until the next tick so that mount hooks are executed
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  test("calls unmounted correct amount of times", async () => {
    const user = userEvent.setup();
    const unmountSpy = vi.fn();
    function App() {
      onUnmount(() => {
        unmountSpy("unmounting app");
      });
      const show$ = createState(true);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => show$.set(false),
          }),
          show$.render((shouldShow) =>
            shouldShow
              ? createElement(NestedComponent)
              : createElement("div", { children: "other" })
          ),
        ],
      });
    }

    function NestedComponent() {
      onUnmount(() => {
        unmountSpy("unmounting nested component");
      });
      const t = createElement("h1", { children: "nested component" });
      t._privateMethods._addUnmountHandler(() => {
        unmountSpy("unmounting h1 nested component");
      });
      return createElement("div", {
        children: [t],
      });
    }

    const component = createElement(App);
    const removeVelesTree = attachComponent({
      htmlElement: document.body,
      component,
    });

    await user.click(screen.getByTestId("button"));

    expect(unmountSpy).toHaveBeenCalledTimes(2);
    expect(unmountSpy.mock.calls[0][0]).toBe("unmounting h1 nested component");
    expect(unmountSpy.mock.calls[1][0]).toBe("unmounting nested component");

    removeVelesTree();

    expect(unmountSpy).toHaveBeenCalledTimes(3);
    expect(unmountSpy.mock.calls[2][0]).toBe("unmounting app");
  });
});
