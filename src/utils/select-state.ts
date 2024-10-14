import { createState } from "../create-state";

type State<StateType> = ReturnType<typeof createState<StateType>>;

function selectState<F, T>(
  state: State<F>,
  selector: (state: F) => T,
  comparator?: (previousSelectedState: T, nextSelectedState: T) => boolean
): State<T> {
  const initialValue = selector(state.getValue());

  const newState = createState(initialValue);
  state.trackValueSelector(
    selector,
    (selectedState) => {
      // we use a function because `selectedState` can be a function itself
      newState.setValue(() => selectedState);
    },
    { skipFirstCall: true, comparator }
  );

  return newState;
}

export { selectState };
