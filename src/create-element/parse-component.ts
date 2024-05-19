import { addContext, popContext } from "../hooks/lifecycle";

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
  const _componentTree = element(props, componentAPI);

  const componentTree =
    typeof _componentTree === "string" || !_componentTree
      ? ({
          velesStringElement: true,
          html: document.createTextNode(
            typeof _componentTree === "string" ? _componentTree : ""
          ),
        } as VelesStringElement)
      : _componentTree;

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
        // this should trigger recursive checks, whether it is a VelesNode or VelesComponent
        // string Nodes don't have lifecycle handlers
        if ("_privateMethods" in velesComponent.tree) {
          velesComponent.tree._privateMethods._callUnmountHandlers();
        }
      },
    },
  };

  return velesComponent;
}

export { parseComponent };
