export default function AdminDataStatus({ loading, error, reload }) {
  if (error)
    return (
      <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
        <p role="alert" className="text-sm text-red-700">
          {error.message || "Unable to load data."}
        </p>
        <button className="btn-secondary mt-3" onClick={reload}>
          Retry
        </button>
      </div>
    );
  if (loading)
    return (
      <p role="status" className="mb-4 text-sm text-slate-500">
        Loading…
      </p>
    );
  return null;
}
