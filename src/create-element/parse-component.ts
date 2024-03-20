import { addContext, popContext } from "../hooks/lifecycle";

import type { VelesComponent, VelesElementProps, ComponentAPI } from "../types";

function parseComponent({
  element,
  props,
}: {
  element: Function;
  props: VelesElementProps;
}) {
  const componentUnmountCbs: Function[] = [];
  const componentMountCbs: Function[] = [];
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
  const componentTree = element(props, componentAPI);
  // here we exit our context
  popContext();
  const velesComponent: VelesComponent = {
    velesComponent: true,
    tree: componentTree,
    _privateMethods: {
      _addUnmountHandler: (cb: Function) => {
        componentAPI.onUnmount(cb);
      },
      _callMountHandlers: () => {
        componentMountCbs.forEach((cb) => cb());
      },
      _callUnmountHandlers: () => {
        componentUnmountCbs.forEach((cb) => cb());
        // this should trigger recursive checks,
        // whether it is a VelesNode or VelesComponent
        velesComponent.tree._privateMethods._callUnmountHandlers();
      },
    },
  };

  return velesComponent;
}

export { parseComponent };
