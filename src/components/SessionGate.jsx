import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { restoreSession } from "../redux/thunks/authThunks";
import { fetchFolders } from "../redux/thunks/mailThunks";

function MailboxBootstrap({ children }) {
  const dispatch = useDispatch();
  const [state, setState] = useState({ status: "loading", error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    dispatch(fetchFolders())
      .unwrap()
      .then(() => {
        if (active) setState({ status: "ready", error: null });
      })
      .catch((error) => {
        if (active) setState({ status: "failed", error });
      });
    return () => {
      active = false;
    };
  }, [dispatch, attempt]);
  if (state.status === "ready") return children;
  return (
    <div className="p-8">
      {state.status === "loading" ? (
        <p role="status">Loading your mailbox…</p>
      ) : (
        <>
          <p role="alert">
            You are signed in, but your mailbox could not be loaded.{" "}
            {state.error?.message}
          </p>
          <button
            className="btn-secondary mt-4"
            onClick={() => {
              setState({ status: "loading", error: null });
              setAttempt((value) => value + 1);
            }}
          >
            Retry mailbox
          </button>
        </>
      )}
    </div>
  );
}

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
        Restoring your session…
      </p>
    );
  }
  if (status === "restoreFailed") {
    return (
      <div className="p-8">
        <p role="alert">Could not restore your session. {error?.message}</p>
        <button
          className="btn-secondary mt-4"
          onClick={() => dispatch(restoreSession())}
        >
          Retry connection
        </button>
      </div>
    );
  }
  return status === "authenticated" ? (
    <MailboxBootstrap>{children}</MailboxBootstrap>
  ) : (
    children
  );
}
