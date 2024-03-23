import { createState } from "./create-state";

type createdState = ReturnType<typeof createState<unknown>>;
export function combineState<T>(
  combineCallback: (...states: unknown[]) => T,
  ...states: createdState[]
) {
  const initialValue = combineCallback(
    ...states.map((state) => state.getValue())
  );
  const combinedState = createState(initialValue);

  states.forEach((state) => {
    state.trackValue(() => {
      // by the time trackValue callback is called
      // it is guaranteed that reading `state.getValue` will
      // return the updated value
      const updatedValue = combineCallback(
        ...states.map((state) => state.getValue())
      );

      combinedState.setValue(() => updatedValue);
    });
  });

  return combinedState;
}
