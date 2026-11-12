import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchSnoozedMessages } from "../redux/thunks/snoozedEmailThunks";

export default function useSnoozedMessages() {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({
    items: [],
    total: 0,
    totalPages: 1,
    loadedPage: 0,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState === "visible")
        setVersion((value) => value + 1);
    };
    const timer = window.setInterval(refreshVisible, 30_000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const operation = dispatch(fetchSnoozedMessages({ page, pageSize: 50 }));
    operation.unwrap().then(
      (data) => {
        if (!active) return;
        setState({
          items: data.items,
          total: data.total ?? data.items.length,
          totalPages: data.totalPages ?? 1,
          loadedPage: page,
          loading: false,
          error: "",
        });
      },
      (error) => {
        if (!active) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message,
        }));
      },
    );
    return () => {
      active = false;
      operation.abort();
    };
  }, [dispatch, page, version]);

  function reload() {
    setState((current) => ({ ...current, loading: true, error: "" }));
    setVersion((value) => value + 1);
  }

  return {
    ...state,
    loading: state.loading || state.loadedPage !== page,
    page,
    setPage,
    reload,
  };
}
