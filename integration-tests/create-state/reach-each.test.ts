import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { attachComponent, createElement, createState, Fragment, onUnmount } from "../../src";

import type { State } from "../../src";

describe("state.renderEach", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("renderEach does not re-mount values which did not change their keys", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const unmountSpy = vi.fn();
    const textSpy = vi.fn();
    function IteratorComponent() {
      const state = createState<Item[]>([item1, item3, item4]);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "updateArrayButton",
            onClick: () => {
              state.update(() => [item2, item1, item3, item5]);
            },
            children: ["update array values"],
          }),
          createElement("button", {
            "data-testid": "updateFirstItem",
            onClick: () => {
              state.update((currentValues) =>
                currentValues.map((value) => {
                  if (value.id === 1) {
                    return {
                      id: 1,
                      text: "updated first value",
                    };
                  } else {
                    return value;
                  }
                }),
              );
            },
          }),
          createElement("ul", {
            "data-testid": "listComponent",
            children: [
              state.renderEach({ key: "id" }, ({ elementState: element$ }) =>
                createElement(() => {
                  onUnmount(unmountSpy);
                  return createElement("li", {
                    children: [
                      element$.renderSelected(
                        (element) => element.text,
                        (text) => {
                          textSpy();
                          return createElement("span", { children: text });
                        },
                      ),
                    ],
                  });
                }),
              ),
            ],
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(IteratorComponent),
    });

    const listElement = screen.getByTestId("listComponent");
    expect(listElement.children.length).toBe(3);
    const firstListElement = listElement.children[0];
    const secondListElement = listElement.children[1];
    const thirdListElement = listElement.children[2];
    expect(textSpy).toHaveBeenCalledTimes(3);

    expect(firstListElement.textContent).toBe(item1.text);
    expect(secondListElement.textContent).toBe(item3.text);
    expect(thirdListElement.textContent).toBe(item4.text);

    await user.click(screen.getByTestId("updateFirstItem"));
    expect(unmountSpy).not.toHaveBeenCalled();
    expect(listElement.children[0].textContent).toBe("updated first value");
    expect(textSpy).toHaveBeenCalledTimes(4);

    await user.click(screen.getByTestId("updateArrayButton"));
    expect(listElement.children.length).toBe(4);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
    expect(textSpy).toHaveBeenCalledTimes(7);
  });

  test("renderEach does support selector option", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const unmountSpy = vi.fn();
    const textSpy = vi.fn();
    function IteratorComponent() {
      const state = createState<{ value: Item[] }>({
        value: [item1, item3, item4],
      });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "updateArrayButton",
            onClick: () => {
              state.update(() => ({ value: [item2, item1, item3, item5] }));
            },
            children: ["update array values"],
          }),
          createElement("button", {
            "data-testid": "updateFirstItem",
            onClick: () => {
              state.update((currentValues) => ({
                value: currentValues.value.map((value) => {
                  if (value.id === 1) {
                    return {
                      id: 1,
                      text: "updated first value",
                    };
                  } else {
                    return value;
                  }
                }),
              }));
            },
          }),
          createElement("ul", {
            "data-testid": "listComponent",
            children: [
              state.renderEach(
                { key: "id", selector: (state) => state.value },
                ({ elementState: element$ }) =>
                  createElement(() => {
                    onUnmount(unmountSpy);
                    return createElement("li", {
                      children: [
                        element$.renderSelected(
                          (element) => element.text,
                          (text) => {
                            textSpy();
                            return createElement("span", { children: text });
                          },
                        ),
                      ],
                    });
                  }),
              ),
            ],
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(IteratorComponent),
    });

    const listElement = screen.getByTestId("listComponent");
    expect(listElement.children.length).toBe(3);
    const firstListElement = listElement.children[0];
    const secondListElement = listElement.children[1];
    const thirdListElement = listElement.children[2];

    expect(firstListElement.textContent).toBe(item1.text);
    expect(secondListElement.textContent).toBe(item3.text);
    expect(thirdListElement.textContent).toBe(item4.text);

    expect(textSpy).toHaveBeenCalledTimes(3);

    await user.click(screen.getByTestId("updateFirstItem"));
    expect(unmountSpy).not.toHaveBeenCalled();
    expect(listElement.children[0].textContent).toBe("updated first value");
    expect(textSpy).toHaveBeenCalledTimes(4);

    await user.click(screen.getByTestId("updateArrayButton"));
    expect(listElement.children.length).toBe(4);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
    expect(textSpy).toHaveBeenCalledTimes(7);
  });

  test("value iterator correctly updates indices after changing order", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    let items = [item1, item2, item3, item4, item5];
    const textSpy = vi.fn();
    const indexSpy = vi.fn();
    function App() {
      const items$ = createState(items);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => items$.set(items),
          }),
          createElement("div", {
            "data-testid": "container",
            children: [
              items$.renderEach({ key: "id" }, ({ elementState: element$, indexState: index$ }) =>
                createElement("div", {
                  children: [
                    createElement("div", {
                      children: index$.render((value) => {
                        indexSpy();
                        return String(value);
                      }),
                    }),
                    ".",
                    createElement("div", {
                      children: element$.renderSelected(
                        (item) => item.text,
                        (value) => {
                          textSpy();
                          return value;
                        },
                      ),
                    }),
                  ],
                }),
              ),
            ],
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(textSpy).toHaveBeenCalledTimes(5);
    expect(indexSpy).toHaveBeenCalledTimes(5);
    const container = screen.getByTestId("container");
    const children = container.children;
    expect(children.length).toBe(5);
    expect(children[0].textContent).toBe("0.first item");
    expect(children[1].textContent).toBe("1.second item");
    expect(children[2].textContent).toBe("2.third item");
    expect(children[3].textContent).toBe("3.fourth item");
    expect(children[4].textContent).toBe("4.fifth item");

    items = [item5, item3, item1, item4, item2];
    await user.click(screen.getByTestId("button"));
    expect(textSpy).toHaveBeenCalledTimes(5);
    expect(indexSpy).toHaveBeenCalledTimes(9);

    expect(children[0].textContent).toBe("0.fifth item");
    expect(children[1].textContent).toBe("1.third item");
    expect(children[2].textContent).toBe("2.first item");
    expect(children[3].textContent).toBe("3.fourth item");
    expect(children[4].textContent).toBe("4.second item");
  });

  test("renderEach supports empty list and renders newly added element", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };

    function App() {
      const items$ = createState<Item[]>([]);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => items$.set([item1]),
          }),
          createElement("ul", {
            "data-testid": "list",
            children: items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
              createElement("li", {
                children: element$.renderSelected((element) => element.text),
              }),
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const list = screen.getByTestId("list");
    expect(list.children.length).toBe(0);

    await user.click(screen.getByTestId("button"));

    expect(list.children.length).toBe(1);
    expect(list.children[0].textContent).toBe("first item");
  });

  test("inserts the first item at the empty iterator's original position", () => {
    type Item = { id: number; text: string };
    const items$ = createState<Item[]>([]);

    function App() {
      return createElement("main", {
        "data-testid": "container",
        children: [
          createElement("i", { children: "before" }),
          items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
            createElement("b", {
              children: element$.renderSelected((element) => element.text),
            }),
          ),
          createElement("i", { children: "after" }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const container = screen.getByTestId("container");
    expect(container.innerHTML).toBe("<i>before</i><i>after</i>");

    items$.set([{ id: 1, text: "item" }]);

    expect(container.innerHTML).toBe("<i>before</i><b>item</b><i>after</i>");

    items$.set([]);
    expect(container.innerHTML).toBe("<i>before</i><i>after</i>");

    items$.set([{ id: 2, text: "second item" }]);
    expect(container.innerHTML).toBe("<i>before</i><b>second item</b><i>after</i>");
  });

  test("renders Fragment-rooted iterator items without a phantom element", () => {
    type Item = { id: number; text: string };
    const items$ = createState<Item[]>([{ id: 1, text: "item" }]);

    function App() {
      return createElement("ul", {
        "data-testid": "list",
        children: items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
          createElement(Fragment, {
            children: createElement("li", {
              children: element$.renderSelected((element) => element.text),
            }),
          }),
        ),
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(screen.getByTestId("list").innerHTML).toBe("<li>item</li>");
  });

  test("supports numeric zero as a renderEach key", () => {
    type Item = { id: number; text: string };
    const items$ = createState<Item[]>([{ id: 0, text: "zero" }]);

    function App() {
      return createElement("ul", {
        "data-testid": "list",
        children: items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
          createElement("li", {
            children: element$.renderSelected((element) => element.text),
          }),
        ),
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    expect(screen.getByTestId("list").innerHTML).toBe("<li>zero</li>");
  });

  test.each(["constructor", "__proto__", "toString"])("supports %s as a renderEach key", (key) => {
    type Item = { id: string; text: string };
    const items$ = createState<Item[]>([]);

    function App() {
      return createElement("ul", {
        "data-testid": "list",
        children: items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
          createElement("li", {
            children: element$.renderSelected((element) => element.text),
          }),
        ),
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    items$.set([{ id: key, text: key }]);

    expect(screen.getByTestId("list").innerHTML).toBe(`<li>${key}</li>`);
  });

  test("renderEach supports removing last element and adding a new one", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };

    function App() {
      const items$ = createState<Item[]>([item1]);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "removeButton",
            onClick: () => items$.set([]),
          }),
          createElement("button", {
            "data-testid": "addButton",
            onClick: () => items$.set([item2]),
          }),
          createElement("ul", {
            "data-testid": "list",
            children: items$.renderEach({ key: "id" }, ({ elementState: element$ }) =>
              createElement("li", {
                children: element$.renderSelected((element) => element.text),
              }),
            ),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(App),
    });

    const list = screen.getByTestId("list");
    expect(list.children.length).toBe(1);
    expect(list.children[0].textContent).toBe("first item");

    await user.click(screen.getByTestId("removeButton"));

    expect(list.children.length).toBe(0);

    await user.click(screen.getByTestId("addButton"));

    expect(list.children.length).toBe(1);
    expect(list.children[0].textContent).toBe("second item");
  });

  test("renderEach does not update until mounted", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const item6: Item = { id: 6, text: "sixth item" };
    const items$ = createState([item1, item2, item3]);
    function App() {
      const show$ = createState(false);
      const itemsMarkup = items$.renderEach(
        { key: "id" },
        ({ elementState: element$, indexState: index$ }) =>
          createElement(Item, {
            element$,
            index$,
          }),
      );
      return createElement("div", {
        children: [
          createElement("h1", { children: "Application" }),
          createElement("button", {
            "data-testid": "button",
            onClick: () => show$.update((value) => !value),
          }),
          createElement("div", {
            "data-testid": "container",
            children: show$.render((shouldShow) => (shouldShow ? itemsMarkup : null)),
          }),
        ],
      });
    }

    const textSpy = vi.fn();
    const indexSpy = vi.fn();
    function Item({ element$, index$ }: { element$: State<Item>; index$: State<number> }) {
      return createElement("div", {
        children: [
          createElement("h3", {
            children: element$.renderSelected((element) => {
              textSpy();
              return element.text;
            }),
          }),
          " ",
          createElement("p", {
            children: index$.render((value) => {
              indexSpy();
              return `number: ${value}`;
            }),
          }),
        ],
      });
    }

    const component = createElement(App);
    attachComponent({
      htmlElement: document.body,
      component,
    });

    // since they are components, they are not executed at all
    // until they are mounted
    expect(textSpy).toHaveBeenCalledTimes(0);
    expect(indexSpy).toHaveBeenCalledTimes(0);

    const container = screen.getByTestId("container");
    const children = container.children;

    items$.set([item4, item2, item3, item1]);

    // empty Text node
    expect(container.childNodes.length).toBe(1);

    expect(textSpy).toHaveBeenCalledTimes(0);
    expect(indexSpy).toHaveBeenCalledTimes(0);

    await user.click(screen.getByTestId("button"));

    expect(textSpy).toHaveBeenCalledTimes(4);
    expect(indexSpy).toHaveBeenCalledTimes(4);

    expect(children.length).toBe(4);
    expect(children[0].textContent).toBe("fourth item number: 0");
    expect(children[1].textContent).toBe("second item number: 1");
    expect(children[2].textContent).toBe("third item number: 2");
    expect(children[3].textContent).toBe("first item number: 3");

    items$.set([item4, item5, item3, item1, item2]);
    expect(textSpy).toHaveBeenCalledTimes(5);
    expect(indexSpy).toHaveBeenCalledTimes(6);

    expect(children.length).toBe(5);
    expect(children[0].textContent).toBe("fourth item number: 0");
    expect(children[1].textContent).toBe("fifth item number: 1");
    expect(children[2].textContent).toBe("third item number: 2");
    expect(children[3].textContent).toBe("first item number: 3");
    expect(children[4].textContent).toBe("second item number: 4");

    await user.click(screen.getByTestId("button"));

    // empty Text node
    expect(container.childNodes.length).toBe(1);

    items$.set([item4, item5, item3, { ...item1, text: "1st item" }, item2, item6]);

    expect(textSpy).toHaveBeenCalledTimes(5);
    expect(indexSpy).toHaveBeenCalledTimes(6);

    await user.click(screen.getByTestId("button"));

    expect(textSpy).toHaveBeenCalledTimes(11);
    expect(indexSpy).toHaveBeenCalledTimes(12);

    expect(children.length).toBe(6);
    expect(children[0].textContent).toBe("fourth item number: 0");
    expect(children[1].textContent).toBe("fifth item number: 1");
    expect(children[2].textContent).toBe("third item number: 2");
    expect(children[3].textContent).toBe("1st item number: 3");
    expect(children[4].textContent).toBe("second item number: 4");
    expect(children[5].textContent).toBe("sixth item number: 5");

    await user.click(screen.getByTestId("button"));

    // empty Text node
    expect(container.childNodes.length).toBe(1);

    items$.set([item3, item6]);

    await user.click(screen.getByTestId("button"));
    expect(textSpy).toHaveBeenCalledTimes(13);
    expect(indexSpy).toHaveBeenCalledTimes(14);
    expect(children.length).toBe(2);
    expect(children[0].textContent).toBe("third item number: 0");
    expect(children[1].textContent).toBe("sixth item number: 1");
  });
});
