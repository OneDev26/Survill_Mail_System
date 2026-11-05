import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Shared read lifecycle: data stays in Redux; requests abort on unmount/filter changes.
export default function useAdminResource(thunk, params = undefined) {
  const dispatch = useDispatch();
  const [revision, setRevision] = useState(0);
  const data = useSelector((state) => state.admin.data[thunk.typePrefix]);
  const request = useSelector(
    (state) => state.admin.requests[thunk.typePrefix],
  );
  useEffect(() => {
    const operation = dispatch(thunk(params));
    return () => operation.abort();
  }, [dispatch, thunk, params, revision]);
  return {
    data,
    loading:
      !request || request.status === "pending" || request.status === "idle",
    error: request?.error,
    reload: () => setRevision((value) => value + 1),
  };
}
