import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import {
  attachComponent,
  createElement,
  createState,
  onUnmount,
  createRef,
} from "../../src";

function shallow(obj1: Record<string, any>, obj2: Record<string, any>) {
  return (
    Object.keys(obj1).length === Object.keys(obj2).length &&
    Object.keys(obj1).every((key) => obj1[key] === obj2[key])
  );
}

describe("createState", () => {
  let cleanup: Function | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  // test to check that we can create subscriptions inside a component
  // and they are called correctly when the state changes
  test("supports custom subscriptions to state", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    const onUnmountCheck = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value));

      onUnmount(() => onUnmountCheck);

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.setValue((currentValue) => currentValue + 1);
            },
          }),
          valueState.useValue((value) =>
            createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(spyFn).toHaveBeenLastCalledWith(2);

    expect(onUnmountCheck).not.toHaveBeenCalled();
  });

  it("supports custom subscriptions with state.trackValue with skipFirstCall option", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value), { skipFirstCall: true });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.setValue((currentValue) => currentValue + 1);
            },
          }),
          valueState.useValue((value) =>
            createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(2);
  });

  it("supports custom subscriptions with state.trackValue with callOnMount option", async () => {
    const user = userEvent.setup();
    const spyFn = jest.fn();
    function StateComponent() {
      const valueState = createState(0);
      valueState.trackValue((value) => spyFn(value), { callOnMount: true });

      return createElement("div", {
        children: [
          createElement("button", {
            "data-testid": "button",
            onClick: () => {
              valueState.setValue((currentValue) => currentValue + 1);
            },
          }),
          valueState.useValue((value) =>
            createElement("div", { children: [`current value is ${value}`] })
          ),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });

    expect(spyFn).toHaveBeenCalledTimes(0);

    // wait until the component is mounted in DOM
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    expect(spyFn).toHaveBeenCalledTimes(1);
    expect(spyFn).toHaveBeenLastCalledWith(0);

    const btn = screen.getByTestId("button");
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(2);
    expect(spyFn).toHaveBeenLastCalledWith(1);
    await user.click(btn);
    expect(spyFn).toHaveBeenCalledTimes(3);
    expect(spyFn).toHaveBeenLastCalledWith(2);
  });

  it("runs trackValueSelector only when the selector value changes", async () => {
    const user = userEvent.setup();
    const nameSpy = jest.fn();
    const emailSpy = jest.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const userState = createState({ name: "", email: "" });

      userState.trackValueSelector((user) => user.name, nameSpy, {
        skipFirstCall: true,
      });

      userState.trackValueSelector((user) => user.email, emailSpy, {
        skipFirstCall: true,
      });

      return createElement("div", {
        children: [
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: userState.useAttribute((user) => user.name),
            onInput: (e) =>
              userState.setValue((currentUser) => ({
                ...currentUser,
                name: e.target.value,
              })),
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "emailInput",
            name: "email",
            value: userState.useAttribute((user) => user.email),
            onInput: (e) =>
              userState.setValue((currentUser) => ({
                ...currentUser,
                email: e.target.value,
              })),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });
    const nameInput = screen.getByTestId("nameInput");
    await user.type(nameInput, "Veles");

    expect(emailSpy).not.toHaveBeenCalled();
    // 1 time per each typed character
    expect(nameSpy).toHaveBeenCalledTimes("Veles".length);

    const emailInput = screen.getByTestId("emailInput");
    await user.type(emailInput, "veles@example.com");

    expect(emailSpy).toHaveBeenCalledTimes("veles@example.com".length);
  });

  it("allows to run custom comparator", async () => {
    const user = userEvent.setup();
    const nameSpy = jest.fn();
    const emailSpy = jest.fn();
    function StateComponent() {
      const inputRef = createRef<HTMLInputElement>();
      const userState = createState({ name: "", email: "" });

      userState.trackValue(nameSpy, {
        skipFirstCall: true,
        comparator: (prevValue, nextValue) => prevValue.name === nextValue.name,
      });

      userState.trackValue(emailSpy, {
        skipFirstCall: true,
        comparator: (prevValue, nextValue) =>
          prevValue.email === nextValue.email,
      });

      return createElement("div", {
        children: [
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "nameInput",
            name: "name",
            value: userState.useAttribute((user) => user.name),
            onInput: (e) =>
              userState.setValue((currentUser) => ({
                ...currentUser,
                name: e.target.value,
              })),
          }),
          createElement("input", {
            ref: inputRef,
            type: "text",
            "data-testid": "emailInput",
            name: "email",
            value: userState.useAttribute((user) => user.email),
            onInput: (e) =>
              userState.setValue((currentUser) => ({
                ...currentUser,
                email: e.target.value,
              })),
          }),
        ],
      });
    }

    cleanup = attachComponent({
      htmlElement: document.body,
      component: createElement(StateComponent),
    });
    const nameInput = screen.getByTestId("nameInput");
    await user.type(nameInput, "Veles");

    expect(emailSpy).not.toHaveBeenCalled();
    // 1 time per each typed character
    expect(nameSpy).toHaveBeenCalledTimes("Veles".length);

    const emailInput = screen.getByTestId("emailInput");
    await user.type(emailInput, "veles@example.com");

    expect(emailSpy).toHaveBeenCalledTimes("veles@example.com".length);
  });
});
