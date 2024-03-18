export type VelesElement = {
  html: HTMLElement;
  velesNode: true;
  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: (VelesElement | VelesComponent)[];
  // not intended to be used directly
  _privateMethods: {
    _addUnmountHandler: Function;
    _callUnmountHandlers: Function;
  };
};

export type VelesComponent = {
  tree: VelesElement | VelesComponent;
  velesComponent: true;
  // not intended to be used directly
  _privateMethods: {
    _callMountHandlers: Function;
    _callUnmountHandlers: Function;
    _addUnmountHandler: Function;
  };
};

export type VelesElementProps = {
  children?: (string | VelesElement | VelesComponent)[] | undefined | null;
  ref?: {
    velesRef: true;
    current: any;
  };
  [htmlAttribute: string]: any;
};
