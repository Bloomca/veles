import { VelesDOMElementProps } from "./dom-types";

import type { JSX } from "./jsx.d.ts";

// an internal representation of DOM nodes in the tree
// despite being DOM nodes, we still can track mounting/unmounting
// (although it is not exposed at the moment)
export type VelesElement = {
  velesNode: true;

  html: HTMLElement;

  phantom?: boolean;

  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: (VelesElement | VelesComponent | VelesStringElement)[];

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

  // not intended to be used directly
  // despite being a text component, having same lifecycle
  // methods is useful for state changes, to remove tracking
  // when the said Text is returned from `useValue` state method
  _privateMethods: {
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
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
type velesChild =
  | string
  | number
  | VelesElement
  | VelesComponent
  | VelesStringElement;
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
} & JSX.HTMLAttributes;

export type ComponentAPI = {
  // You can return a function from the mount callback, and it will be
  // automatically registered as `onUnmount` callback
  onMount: (cb: Function) => void | Function;
  onUnmount: (cb: Function) => void;
};

export type ComponentFunction = (
  props: VelesElementProps,
  componentAPI: ComponentAPI
) => VelesElement | VelesComponent | string | null;

export type AttributeHelper<T> = {
  (htmlElement: HTMLElement, attributeName: string, node: VelesElement): T;
  velesAttribute: boolean;
};
