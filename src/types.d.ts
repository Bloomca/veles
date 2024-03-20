// an internal representation of DOM nodes in the tree
// despite being DOM nodes, we still can track mounting/unmounting
// (although it is not exposed at the moment)
export type VelesElement = {
  velesNode: true;

  html: HTMLElement;

  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: (VelesElement | VelesComponent)[];

  // not intended to be used directly
  _privateMethods: {
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

// an internal representation of components in the tree
export type VelesComponent = {
  velesComponent: true;

  tree: VelesElement | VelesComponent;

  // not intended to be used directly
  _privateMethods: {
    _callMountHandlers: Function;
    _callUnmountHandlers: Function;
    _addUnmountHandler: Function;
  };
};

// all supported child options
type velesChild = string | VelesElement | VelesComponent;

export type VelesElementProps = {
  children?: velesChild | velesChild[] | undefined | null;
  ref?: {
    velesRef: true;
    current: any;
  };

  // event handlers + any html properties
  // the value can be either a string value
  // or a function in case we support reactivity
  // TODO: we can improve these types
  [htmlAttribute: string]: any;
};

export type ComponentAPI = {
  onMount: (cb: Function) => void;
  onUnmount: (cb: Function) => void;
};
