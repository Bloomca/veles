import type { JSX } from "./jsx.d.ts";

// an internal representation of DOM nodes in the tree
// despite being DOM nodes, we still can track mounting/unmounting
// (although it is not exposed at the moment)
export type VelesElement = {
  velesNode: true;

  html: HTMLElement;

  phantom?: boolean;
  portal?: null | HTMLElement;

  needExecutedVersion?: boolean;
  executedVersion?: ExecutedVelesElement;

  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: (VelesElement | VelesComponentObject | VelesStringElement)[];

  // not intended to be used directly
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

export type ExecutedVelesElement = {
  executedVelesNode: true;

  html: HTMLElement;

  phantom?: boolean;
  portal?: HTMLElement;

  // every element except the most top one should have one
  parentVelesElement?: ExecutedVelesElement;
  childComponents: (
    | ExecutedVelesElement
    | ExecutedVelesComponent
    | ExecutedVelesStringElement
  )[];

  // not intended to be used directly
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

export type VelesStringElement = {
  velesStringElement: true;
  html: Text;
  parentVelesElement?: VelesElement;

  needExecutedVersion?: boolean;
  executedVersion?: ExecutedVelesStringElement;

  // not intended to be used directly
  // despite being a text component, having same lifecycle
  // methods is useful for state changes, to remove tracking
  // when the said Text is returned from `useValue` state method
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

export type ExecutedVelesStringElement = {
  executedVelesStringElement: true;
  html: Text;
  parentVelesElement?: ExecutedVelesElement;

  // not intended to be used directly
  // despite being a text component, having same lifecycle
  // methods is useful for state changes, to remove tracking
  // when the said Text is returned from `useValue` state method
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

// an internal representation of components in the tree
export type VelesComponent = {
  velesComponent: true;
  parentVelesElement?: VelesElement;

  tree: VelesElement | VelesComponentObject | VelesStringElement;

  // not intended to be used directly
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _callUnmountHandlers: Function;
    _addUnmountHandler: Function;
  };
};

export type ExecutedVelesComponent = {
  executedVelesComponent: true;

  tree:
    | ExecutedVelesElement
    | ExecutedVelesComponent
    | ExecutedVelesStringElement;

  // not intended to be used directly
  _privateMethods: {
    _addMountHandler: Function;
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
  | VelesComponentObject
  | VelesStringElement;
export type VelesChildren = velesChild | velesChild[] | undefined | null;

export type VelesElementProps = {
  children?: VelesChildren;
  ref?: {
    velesRef: true;
    current: any;
  };

  portal?: HTMLElement;

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
) => VelesElement | VelesComponentObject | VelesStringElement | string | null;

export type AttributeHelper<T> = {
  (htmlElement: HTMLElement, attributeName: string, node: VelesElement): T;
  velesAttribute: boolean;
};

export type VelesComponentObject = {
  velesComponentObject: true;
  element: ComponentFunction;
  props: VelesElementProps;
  insertAfter?: VelesComponentObject | HTMLElement | Text | null;
  html?: HTMLElement | Text;
  parentVelesElement?: VelesElement;
  portal?: HTMLElement;

  needExecutedVersion?: boolean;
  executedVersion?: ExecutedVelesComponent;

  // not intended to be used directly
  _privateMethods: {
    _addMountHandler: Function;
    _callMountHandlers: Function;
    _callUnmountHandlers: Function;
    _addUnmountHandler: Function;
  };
};
