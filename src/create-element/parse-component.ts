import { addContext, popContext } from "../hooks/lifecycle";
import { createTextElement } from "./create-text-element";

import type {
  VelesComponent,
  VelesStringElement,
  VelesElementProps,
  ComponentAPI,
  ComponentFunction,
} from "../types";

function parseComponent({
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
        // componentMountCbs = [];
      },
      _callUnmountHandlers: () => {
        // this should trigger recursive checks, whether it is a VelesNode or VelesComponent
        // string Nodes don't have lifecycle handlers
        if ("_privateMethods" in velesComponent.tree) {
          velesComponent.tree._privateMethods._callUnmountHandlers();
        }

        // we execute own unmount callbacks after children, so the order is reversed
        componentUnmountCbs.forEach((cb) => cb());
        // componentUnmountCbs = [];
      },
    },
  };

  return velesComponent;
}

export { parseComponent };
