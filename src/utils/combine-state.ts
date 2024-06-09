import { createState } from "../create-state";

type createdState<StateType> = ReturnType<typeof createState<StateType>>;

export function combineState<A, B>(
  state1: createdState<A>,
  state2: createdState<B>
): createdState<[A, B]>;
export function combineState<A, B, C>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>
): createdState<[A, B, C]>;
export function combineState<A, B, C, D>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>
): createdState<[A, B, C, D]>;
export function combineState<A, B, C, D, E>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>
): createdState<[A, B, C, D, E]>;
export function combineState<A, B, C, D, E, F>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>,
  state6: createdState<F>
): createdState<[A, B, C, D, E, F]>;
export function combineState<A, B, C, D, E, F, G>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>,
  state6: createdState<F>,
  state7: createdState<G>
): createdState<[A, B, C, D, E, F, G]>;
export function combineState<A, B, C, D, E, F, G, H>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>,
  state6: createdState<F>,
  state7: createdState<G>,
  state8: createdState<H>
): createdState<[A, B, C, D, E, F, G, H]>;
export function combineState<A, B, C, D, E, F, G, H, I>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>,
  state6: createdState<F>,
  state7: createdState<G>,
  state8: createdState<H>,
  state9: createdState<I>
): createdState<[A, B, C, D, E, F, G, H, I]>;
export function combineState<A, B, C, D, E, F, G, H, I, J>(
  state1: createdState<A>,
  state2: createdState<B>,
  state3: createdState<C>,
  state4: createdState<D>,
  state5: createdState<E>,
  state6: createdState<F>,
  state7: createdState<G>,
  state8: createdState<H>,
  state9: createdState<I>,
  state10: createdState<J>
): createdState<[A, B, C, D, E, F, G, H, I, J]>;
export function combineState(...states) {
  const initialValue = states.map((state) => state.getValue());
  const combinedState = createState(initialValue);

  states.forEach((state) => {
    state.trackValue(() => {
      // by the time trackValue callback is called
      // it is guaranteed that reading `state.getValue` will
      // return the updated value
      const updatedValue = states.map((state) => state.getValue());
      combinedState.setValue(updatedValue);
    });
  });

  return combinedState;
}
