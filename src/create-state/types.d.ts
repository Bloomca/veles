import type {
  VelesElement,
  VelesComponentObject,
  VelesStringElement,
  AttributeHelper,
  ExecutedVelesElement,
  ExecutedVelesComponent,
} from "../types";

export type State<ValueType> = {
  trackValue(
    cb: (value: ValueType) => void | Function,
    options?: {
      callOnMount?: boolean;
      skipFirstCall?: boolean;
      comparator?: (value1: ValueType, value2: ValueType) => boolean;
    }
  ): void;
  trackValueSelector<SelectorValueType>(
    selector: (value: ValueType) => SelectorValueType,
    cb: (value: SelectorValueType) => void | Function,
    options?: {
      callOnMount?: boolean;
      skipFirstCall?: boolean;
      comparator?: (
        value1: SelectorValueType,
        value2: SelectorValueType
      ) => boolean;
    }
  ): void;
  useValue(
    cb?: (
      value: ValueType
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator?: (value1: ValueType, value2: ValueType) => boolean
  ): VelesElement | VelesComponentObject | VelesStringElement;
  useValueSelector<SelectorValueType>(
    selector: (value: ValueType) => SelectorValueType,
    cb?: (
      value: SelectorValueType
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator?: (
      value1: SelectorValueType,
      value2: SelectorValueType
    ) => boolean
  ): VelesElement | VelesComponentObject | VelesStringElement;
  useAttribute(cb?: (value: ValueType) => any): AttributeHelper<any>;
  useValueIterator<Element>(
    options: {
      key: string | ((options: { element: Element; index: number }) => string);
      selector?: (value: ValueType) => Element[];
    },
    cb: (props: {
      elementState: State<Element>;
      indexState: State<number>;
    }) => VelesElement | VelesComponentObject
  ): VelesComponentObject | VelesElement | null;
  getValue(): ValueType;
  getPreviousValue(): undefined | ValueType;
  setValue(
    newValueCB: ((currentValue: ValueType) => ValueType) | ValueType
  ): void;
};

export function createState<T>(
  initialValue: T,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"]
  ) => Function
): State<T>;

type TrackingEffect = {
  cb: (value: any) => void;
  selector?: Function;
  comparator?: (value1: any, value2: any) => boolean;
  selectedValue: any;
};

export type TrackingSelectorElement = {
  cb?: (
    value: any
  ) => VelesElement | VelesComponentObject | string | undefined | null;
  selector?: Function;
  selectedValue: any;
  comparator: (value1: any, value2: any) => boolean;
  node: VelesElement | VelesComponentObject | VelesStringElement;
};

export type TrackingAttribute = {
  cb?: Function;
  htmlElement: HTMLElement;
  attributeName: string;
  attributeValue: any;
};

export type TrackingIterator = {
  cb: (props: {
    elementState: State<any>;
    indexState: State<number>;
  }) => VelesElement | VelesComponentObject;
  selector?: (value: unknown) => any[];
  renderedElements: [
    { executedVersion?: ExecutedVelesElement | ExecutedVelesComponent },
    string,
    State<unknown>
  ][];
  key: string | ((options: { element: unknown; index: number }) => string);
  elementsByKey: {
    [key: string]: {
      elementState: State<unknown>;
      indexState: State<number>;
      indexValue: number;
      node: {
        executedVersion?: ExecutedVelesElement | ExecutedVelesComponent;
      };
    };
  };
  wrapperComponent: VelesElement | VelesComponentObject;
};

export type StateTrackers = {
  trackingEffects: TrackingEffect[];
  trackingSelectorElements: TrackingSelectorElement[];
  trackingAttributes: TrackingAttribute[];
  trackingIterators: TrackingIterator[];
};
