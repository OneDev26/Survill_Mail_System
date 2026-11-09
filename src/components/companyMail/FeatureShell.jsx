export default function FeatureShell({
  title,
  description,
  resource,
  children,
}) {
  return (
    <section className="thin-scrollbar min-w-0 flex-1 overflow-y-auto p-5 sm:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <button
          className="btn-secondary"
          disabled={resource.busy || resource.loading}
          onClick={resource.reload}
        >
          Refresh
        </button>
      </div>
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Preview service.</strong> Records are saved to the server, but
        may reset when the service restarts.
      </p>
      {resource.error && (
        <div role="alert" className="mb-4 text-sm text-red-600">
          {resource.error}
          <button className="btn-secondary ml-3" onClick={resource.reload}>
            Retry
          </button>
        </div>
      )}
      {resource.loading ? (
        <p role="status">Loading…</p>
      ) : (
        <fieldset
          disabled={resource.busy || resource.stale || resource.readFailed}
          className="min-w-0 space-y-5"
        >
          {children}
        </fieldset>
      )}
    </section>
  );
}
