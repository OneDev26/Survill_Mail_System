import { notify } from "../redux/slice/uiSlice";

export function reportError(dispatch, error) {
  if (error?.name === "AbortError" || error?.name === "ConditionError") return;
  dispatch(
    notify({
      error: true,
      text: error?.message || "The request failed. Please try again.",
    }),
  );
}
