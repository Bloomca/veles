export type VelesElement = {
  html: HTMLElement;
  velesNode: true;
  parentNode?: HTMLElement;
  childComponents: VelesElement[];
};

export type VelesElementProps = {
  children?: (string | VelesElement)[];
  ref?: {
    velesRef: true;
    current: any;
  };
  [htmlAttribute: string]: any;
};
