import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
} from "../../src";

import type { State } from "../../src";

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test("useValueIterator does not re-mount values which did not change their keys", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const unmountSpy = jest.fn();
    function IteratorComponent() {
      const state = createState<Item[]>([item1, item3, item4]);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "updateArrayButton",
            onClick: () => {
              state.setValue(() => [item2, item1, item3, item5]);
            },
            children: ["update array values"],
          }),
          createElement("button", {
            "data-testid": "updateFirstItem",
            onClick: () => {
              state.setValue((currentValues) =>
                currentValues.map((value) => {
                  if (value.id === 1) {
                    return {
                      id: 1,
                      text: "updated first value",
                    };
                  } else {
                    return value;
                  }
                })
              );
            },
          }),
          createElement("ul", {
            "data-testid": "listComponent",
            children: [
              state.useValueIterator<Item>({ key: "id" }, ({ elementState }) =>
                createElement(() => {
                  onUnmount(unmountSpy);
                  return createElement("li", {
                    children: [
                      elementState.useValueSelector(
                        (element) => element.text,
                        (text) => createElement("span", { children: text })
                      ),
                    ],
                  });
                })
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
    expect(listElement.childNodes.length).toBe(3);
    const firstListElement = listElement.childNodes[0];
    const secondListElement = listElement.childNodes[1];
    const thirdListElement = listElement.childNodes[2];

    expect(firstListElement.textContent).toBe(item1.text);
    expect(secondListElement.textContent).toBe(item3.text);
    expect(thirdListElement.textContent).toBe(item4.text);

    await user.click(screen.getByTestId("updateFirstItem"));
    expect(unmountSpy).not.toHaveBeenCalled();
    expect(listElement.childNodes[0].textContent).toBe("updated first value");

    await user.click(screen.getByTestId("updateArrayButton"));
    expect(listElement.childNodes.length).toBe(4);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
  });

  test("useValueIterator does support selector option", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const unmountSpy = jest.fn();
    function IteratorComponent() {
      const state = createState<{ value: Item[] }>({
        value: [item1, item3, item4],
      });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "updateArrayButton",
            onClick: () => {
              state.setValue(() => ({ value: [item2, item1, item3, item5] }));
            },
            children: ["update array values"],
          }),
          createElement("button", {
            "data-testid": "updateFirstItem",
            onClick: () => {
              state.setValue((currentValues) => ({
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
              state.useValueIterator(
                { key: "id", selector: (state) => state.value },
                ({ elementState }) =>
                  createElement(() => {
                    onUnmount(unmountSpy);
                    return createElement("li", {
                      children: [
                        elementState.useValueSelector(
                          (element) => element.text,
                          (text) => createElement("span", { children: text })
                        ),
                      ],
                    });
                  })
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
    expect(listElement.childNodes.length).toBe(3);
    const firstListElement = listElement.childNodes[0];
    const secondListElement = listElement.childNodes[1];
    const thirdListElement = listElement.childNodes[2];

    expect(firstListElement.textContent).toBe(item1.text);
    expect(secondListElement.textContent).toBe(item3.text);
    expect(thirdListElement.textContent).toBe(item4.text);

    await user.click(screen.getByTestId("updateFirstItem"));
    expect(unmountSpy).not.toHaveBeenCalled();
    expect(listElement.childNodes[0].textContent).toBe("updated first value");

    await user.click(screen.getByTestId("updateArrayButton"));
    expect(listElement.childNodes.length).toBe(4);
    expect(unmountSpy).toHaveBeenCalledTimes(1);
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
    function App() {
      const itemsState = createState(items);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => itemsState.setValue(items),
          }),
          createElement("div", {
            "data-testid": "container",
            children: [
              itemsState.useValueIterator<Item>(
                { key: "id" },
                ({ elementState, indexState }) =>
                  createElement("div", {
                    children: [
                      createElement("div", {
                        children: indexState.useValue(),
                      }),
                      ".",
                      createElement("div", {
                        children: elementState.useValueSelector(
                          (item) => item.text
                        ),
                      }),
                    ],
                  })
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

    const container = screen.getByTestId("container");
    const children = container.childNodes;
    expect(children.length).toBe(5);
    expect(children[0].textContent).toBe("0.first item");
    expect(children[1].textContent).toBe("1.second item");
    expect(children[2].textContent).toBe("2.third item");
    expect(children[3].textContent).toBe("3.fourth item");
    expect(children[4].textContent).toBe("4.fifth item");

    items = [item5, item3, item1, item4, item2];
    await user.click(screen.getByTestId("button"));

    expect(children[0].textContent).toBe("0.fifth item");
    expect(children[1].textContent).toBe("1.third item");
    expect(children[2].textContent).toBe("2.first item");
    expect(children[3].textContent).toBe("3.fourth item");
    expect(children[4].textContent).toBe("4.second item");
  });

  test("useValueIterator does not update until mounted", async () => {
    const user = userEvent.setup();
    type Item = { id: number; text: string };
    const item1: Item = { id: 1, text: "first item" };
    const item2: Item = { id: 2, text: "second item" };
    const item3: Item = { id: 3, text: "third item" };
    const item4: Item = { id: 4, text: "fourth item" };
    const item5: Item = { id: 5, text: "fifth item" };
    const item6: Item = { id: 6, text: "sixth item" };
    const itemsState = createState([item1, item2, item3]);
    function App() {
      const showState = createState(false);
      const itemsMarkup = itemsState.useValueIterator<Item>(
        { key: "id" },
        ({ elementState, indexState }) =>
          createElement(Item, {
            elementState,
            indexState,
          })
      );
      return createElement("div", {
        children: [
          createElement("h1", { children: "Application" }),
          createElement("button", {
            "data-testid": "button",
            onClick: () => showState.setValue((value) => !value),
          }),
          createElement("div", {
            "data-testid": "container",
            children: showState.useValue((shouldShow) =>
              shouldShow ? itemsMarkup : null
            ),
          }),
        ],
      });
    }

    const textSpy = jest.fn();
    const indexSpy = jest.fn();
    function Item({
      elementState,
      indexState,
    }: {
      elementState: State<Item>;
      indexState: State<number>;
    }) {
      return createElement("div", {
        children: [
          createElement("h3", {
            children: elementState.useValueSelector((element) => {
              textSpy();
              return element.text;
            }),
          }),
          " ",
          createElement("p", {
            children: indexState.useValue((value) => {
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
    const children = container.childNodes;

    itemsState.setValue([item4, item2, item3, item1]);

    // empty Text node
    expect(children.length).toBe(1);

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

    itemsState.setValue([item4, item5, item3, item1, item2]);
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
    expect(children.length).toBe(1);

    itemsState.setValue([
      item4,
      item5,
      item3,
      { ...item1, text: "1st item" },
      item2,
      item6,
    ]);

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
    expect(children.length).toBe(1);

    itemsState.setValue([item3, item6]);

    await user.click(screen.getByTestId("button"));
    expect(textSpy).toHaveBeenCalledTimes(15);
    expect(indexSpy).toHaveBeenCalledTimes(16);
    expect(children.length).toBe(2);
    expect(children[0].textContent).toBe("third item number: 0");
    expect(children[1].textContent).toBe("sixth item number: 1");
  });
});
