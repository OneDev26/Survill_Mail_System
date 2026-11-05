import { useState } from "react";
import useAdminResource from "../hooks/useAdminResource";
import { fetchInboundLog } from "../redux/thunks/adminThunks";
import AdminDataStatus from "../components/AdminDataStatus";

export default function AdminInboundLog() {
  const [limit, setLimit] = useState(25);
  const resource = useAdminResource(fetchInboundLog, limit);
  const items = resource.data?.items || [];
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Inbound log</h2>
          <p>Review incoming mail processing and delivery results.</p>
        </div>
        <button
          className="btn-secondary"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          Refresh inbound log
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
          (items.length ? (
            <div className="admin-table-scroll">
              <table className="admin-table" aria-label="Inbound log">
                <thead>
                  <tr>
                    {[
                      "Log ID",
                      "SES message ID",
                      "Status",
                      "Detail",
                      "Recipients",
                      "Processed at",
                    ].map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id || "—"}</td>
                      <td>{item.ses_message_id || "—"}</td>
                      <td>{item.status || "—"}</td>
                      <td className="whitespace-pre-wrap break-words">
                        {item.detail == null
                          ? "—"
                          : typeof item.detail === "string"
                            ? item.detail
                            : JSON.stringify(item.detail, null, 2)}
                      </td>
                      <td>{item.recipients?.join(", ") || "—"}</td>
                      <td>
                        {item.processed_at ? (
                          <time dateTime={item.processed_at}>
                            {item.processed_at}
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
            <p className="admin-empty">No inbound log entries found.</p>
          ))}
      </div>
    </>
  );
}
