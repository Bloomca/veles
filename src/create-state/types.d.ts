import type {
  VelesElement,
  VelesComponentObject,
  VelesStringElement,
  AttributeHelper,
} from "../types";
import type { ComponentContext } from "../context/types";

type StateEquality<ValueType> = (value1: ValueType, value2: ValueType) => boolean;

type StateLike<ValueType> = State<ValueType>;

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
  render(
    cb?: (
      value: ValueType
    ) => VelesElement | VelesComponentObject | string | undefined | null,
    comparator?: (value1: ValueType, value2: ValueType) => boolean
  ): VelesElement | VelesComponentObject | VelesStringElement;
  useValueSelector: {
    (
      selector: undefined,
      cb?: (
        value: ValueType
      ) => VelesElement | VelesComponentObject | string | undefined | null,
      comparator?: (value1: ValueType, value2: ValueType) => boolean
    ): VelesElement | VelesComponentObject | VelesStringElement;
    <SelectorValueType>(
      selector: (value: ValueType) => SelectorValueType,
      cb?: (
        value: SelectorValueType
      ) => VelesElement | VelesComponentObject | string | undefined | null,
      comparator?: (
        value1: SelectorValueType,
        value2: SelectorValueType
      ) => boolean
    ): VelesElement | VelesComponentObject | VelesStringElement;
  };
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
  map<SelectorValueType>(
    selector: (value: ValueType) => SelectorValueType,
    options?: {
      equality?: StateEquality<SelectorValueType>;
    }
  ): State<SelectorValueType>;
  filter(
    predicate: (value: ValueType, prevValue?: ValueType | undefined) => boolean,
    options?: {
      equality?: StateEquality<ValueType>;
    }
  ): State<ValueType>;
  scan<AccumulatorValueType>(
    reducer: (
      acc: AccumulatorValueType,
      value: ValueType,
      prevValue?: ValueType | undefined
    ) => AccumulatorValueType,
    initialValue: AccumulatorValueType,
    options?: {
      equality?: StateEquality<AccumulatorValueType>;
    }
  ): State<AccumulatorValueType>;
  combine<Sources extends [StateLike<any>, ...StateLike<any>[]]>(
    ...states: Sources
  ): State<
    [
      ValueType,
      ...{
        [K in keyof Sources]: Sources[K] extends StateLike<infer U>
          ? U
          : never;
      }
    ]
  >;
  dispose(): void;
  getValue(): ValueType;
  getPreviousValue(): undefined | ValueType;
  setValue(newValue: ValueType): void;
  updateValue(newValueCB: (currentValue: ValueType) => ValueType): void;
};

export function createState<T>(
  initialValue: T,
  subscribeCallback?: (
    setValue: ReturnType<typeof createState<T>>["setValue"]
  ) => Function
): State<T>;

export namespace createState {
  const empty: symbol;
}

export type TrackingSelectorElement = {
  cb?: (
    value: any
  ) => VelesElement | VelesComponentObject | string | undefined | null;
  selector?: Function;
  selectedValue: any;
  comparator: (value1: any, value2: any) => boolean;
  node: VelesElement | VelesComponentObject | VelesStringElement;
  savedContext: ComponentContext;
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
    VelesElement | VelesComponentObject,
    string,
    State<unknown>
  ][];
  key: string | ((options: { element: unknown; index: number }) => string);
  elementsByKey: {
    [key: string]: {
      elementState: State<unknown>;
      indexState: State<number>;
      indexValue: number;
      node: VelesElement | VelesComponentObject;
    };
  };
  wrapperComponent: VelesElement | VelesComponentObject;
  savedContext: ComponentContext;
};

export type StateTrackers = {
  trackingSelectorElements: TrackingSelectorElement[];
  trackingAttributes: TrackingAttribute[];
  trackingIterators: TrackingIterator[];
};
