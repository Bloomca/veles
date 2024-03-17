export type VelesElement = {
  html: HTMLElement;
  velesNode: true;
  // every element except the most top one should have one
  parentVelesElement?: VelesElement;
  childComponents: VelesElement[];
  // private methods, not intended to be used directly
  _addUnmountHandler: Function;
  _callUnmountHandlers: Function;
};

export type VelesElementProps = {
  children?: (string | VelesElement)[];
  ref?: {
    velesRef: true;
    current: any;
  };
  [htmlAttribute: string]: any;
};
