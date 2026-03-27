import { createState, createStateFromCore, getStateCore } from "../create-state";
import { createCoreEquality } from "../create-state/state-core";
import { onUnmount } from "../hooks";

type State<StateType> = ReturnType<typeof createState<StateType>>;

function selectState<F, T>(
  state: State<F>,
  selector: (state: F) => T,
  comparator?: (previousSelectedState: T, nextSelectedState: T) => boolean
): State<T> {
  const selectedCore = getStateCore(state).map(selector, {
    equality: createCoreEquality(comparator),
  });

  const newState = createStateFromCore(selectedCore);

  onUnmount(() => {
    selectedCore.dispose();
  });

  return newState;
}

export { selectState };
