import { useState } from "react";
import useAdminResource from "../hooks/useAdminResource";
import { fetchAuditLog } from "../redux/thunks/adminThunks";
import AdminDataStatus from "../components/AdminDataStatus";

export default function AdminAuditLog() {
  const [limit, setLimit] = useState(25);
  const resource = useAdminResource(fetchAuditLog, limit);
  const items = resource.data?.items || [];
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Audit log</h2>
          <p>Review account activity and administrative events.</p>
        </div>
        <button
          className="btn-secondary"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          Refresh audit log
        </button>
      </div>
      <div className="admin-panel">
        <div className="admin-toolbar">
          <label className="flex items-center gap-2">
            Record limit
            <select
              className="field admin-filter"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              {[25, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <AdminDataStatus {...resource} />
        {!resource.loading &&
          !resource.error &&
          (resource.data?.available === false ? (
            <p className="admin-empty" role="status">
              {resource.data.message || "Audit log is not available yet."}
            </p>
          ) : resource.data?.available === true ? (
            <>
              <p className="px-4 py-3 text-sm text-slate-500">
                Showing {items.length} of {resource.data.total ?? items.length}{" "}
                audit events
              </p>
              {items.length ? (
                <div className="admin-table-scroll">
                  <table className="admin-table" aria-label="Audit log">
                    <thead>
                      <tr>
                        {[
                          "Log ID",
                          "Event type",
                          "Actor email",
                          "Target type",
                          "Target ID",
                          "Details",
                          "Created at",
                        ].map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id || "—"}</td>
                          <td>{item.eventType || "—"}</td>
                          <td>{item.actorEmail || "—"}</td>
                          <td>{item.targetType || "—"}</td>
                          <td>{item.targetId || "—"}</td>
                          <td className="whitespace-pre-wrap break-words">
                            {item.details == null
                              ? "—"
                              : typeof item.details === "string"
                                ? item.details
                                : JSON.stringify(item.details, null, 2)}
                          </td>
                          <td>
                            {item.createdAt ? (
                              <time dateTime={item.createdAt}>
                                {item.createdAt}
                              </time>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="admin-empty">No audit log entries found.</p>
              )}
            </>
          ) : null)}
      </div>
    </>
  );
}
