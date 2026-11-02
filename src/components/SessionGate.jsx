import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreSession } from "../redux/thunks/authThunks";

export default function SessionGate({ children }) {
  const dispatch = useDispatch();
  const { status, bootstrapError: error } = useSelector((state) => state.auth);
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);
  if (status === "idle" || status === "restoring") {
    // Login has its own pending UI; restoration happens only before the first render.
    return (
      <p role="status" className="p-8">
        Connecting to your mailbox?
      </p>
    );
  }
  return (
    <>
      {error && error.status !== 401 && (
        <div role="alert" className="bg-amber-50 p-3 text-sm">
          {error.message}
        </div>
      )}
      {children}
    </>
  );
}
