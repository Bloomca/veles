import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
} from "../../src";

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
});
