import { addContext, popContext } from "../hooks/lifecycle";
import { createTextElement } from "./create-text-element";

import type {
  VelesComponent,
  VelesElementProps,
  ComponentAPI,
  ComponentFunction,
  VelesComponentObject,
} from "../types";

// only parse, do not execute and render it
function parseComponent({
  element,
  props,
}: {
  element: ComponentFunction;
  props: VelesElementProps;
}): VelesComponentObject {
  const mountCbs: Function[] = [];
  const unmountCbs: Function[] = [];
  return {
    velesComponentObject: true,
    element,
    props,
    _privateMethods: {
      _addMountHandler(cb: Function) {
        mountCbs.push(cb);
      },
      _addUnmountHandler: (cb: Function) => {
        unmountCbs.push(cb);
      },
      _callMountHandlers: () => {
        mountCbs.forEach((cb) => cb());
      },
      _callUnmountHandlers: () => {
        unmountCbs.forEach((cb) => cb());
      },
    },
  };
}

function executeComponent({
  element,
  props,
}: {
  element: ComponentFunction;
  props: VelesElementProps;
}) {
  let componentUnmountCbs: Function[] = [];
  let componentMountCbs: Function[] = [];
  const componentAPI: ComponentAPI = {
    onMount: (cb) => {
      componentMountCbs.push(cb);
    },
    onUnmount: (cb) => {
      componentUnmountCbs.push(cb);
    },
  };
  // at this moment we enter new context
  addContext(componentAPI);
  const _componentTree = element(props, componentAPI);

  const componentTree =
    typeof _componentTree === "string" || !_componentTree
      ? createTextElement(_componentTree as string)
      : _componentTree;

  // here we exit our context
  popContext();
  const velesComponent: VelesComponent = {
    velesComponent: true,
    tree: componentTree,
    _privateMethods: {
      _addMountHandler(cb: Function) {
        componentMountCbs.push(cb);
      },
      _addUnmountHandler: (cb: Function) => {
        componentAPI.onUnmount(cb);
      },
      _callMountHandlers: () => {
        componentMountCbs.forEach((cb) => {
          const mountCbResult = cb();

          if (typeof mountCbResult === "function") {
            componentAPI.onUnmount(mountCbResult);
          }
        });
      },
      _callUnmountHandlers: () => {
        componentUnmountCbs.forEach((cb) => cb());
      },
    },
  };

  return velesComponent;
}

export { parseComponent, executeComponent };
