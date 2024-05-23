import { VelesDOMElementProps } from "./dom-types";

// an internal representation of DOM nodes in the tree
// despite being DOM nodes, we still can track mounting/unmounting
// (although it is not exposed at the moment)
export type VelesElement = {
  velesNode: true;

  html: HTMLElement;

  phantom?: boolean;

  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: (VelesElement | VelesComponent)[];

  // not intended to be used directly
  _privateMethods: {
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

export type VelesStringElement = {
  velesStringElement: true;
  html: Text;
  parentVelesElement?: VelesElement;
};

// an internal representation of components in the tree
export type VelesComponent = {
  velesComponent: true;

  tree: VelesElement | VelesComponent | VelesStringElement;

  // not intended to be used directly
  _privateMethods: {
    _callMountHandlers: Function;
    _callUnmountHandlers: Function;
    _addUnmountHandler: Function;
  };
};

// all supported child options
type velesChild = string | VelesElement | VelesComponent;
export type VelesChildren = velesChild | velesChild[] | undefined | null;

export type VelesElementProps = {
  children?: VelesChildren;
  ref?: {
    velesRef: true;
    current: any;
  };

  // event handlers + any html properties
  // the value can be either a string value
  // or a function in case we support reactivity
  // TODO: we can improve these types
  [htmlAttribute: string]: any;
} & VelesDOMElementProps;

export type ComponentAPI = {
  onMount: (cb: Function) => void;
  onUnmount: (cb: Function) => void;
};

export type ComponentFunction = (
  props: VelesElementProps,
  componentAPI: ComponentAPI
) => VelesElement | VelesComponent | string | null;
