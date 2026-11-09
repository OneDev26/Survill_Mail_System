import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useCompanyMail(kind, actions) {
  const dispatch = useDispatch();
  const data = useSelector((state) => state[kind]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const read = data.requests[actions.fetch.typePrefix];
  useEffect(() => {
    const operation = dispatch(actions.fetch());
    return () => operation.abort();
  }, [dispatch, actions]);
  async function reload() {
    setError("");
    try {
      await dispatch(actions.fetch()).unwrap();
    } catch (err) {
      setError(err.message);
    }
  }
  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await dispatch(action).unwrap();
      try {
        await dispatch(actions.fetch()).unwrap();
      } catch (err) {
        setError(
          `Changes were saved, but the list could not be refreshed. ${err.message}`,
        );
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    items: data.items || [],
    total: data.total,
    stale: data.stale,
    loading: read?.status === "pending" || (!read && data.items === null),
    error: error || read?.error?.message,
    readFailed: read?.status === "failed",
    busy,
    run,
    reload,
  };
}
