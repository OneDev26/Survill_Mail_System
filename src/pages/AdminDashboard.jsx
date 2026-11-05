import { Link } from "react-router-dom";
import useAdminResource from "../hooks/useAdminResource";
import {
  fetchAdminOverview,
  fetchAdminReports,
} from "../redux/thunks/adminThunks";
import AdminDataStatus from "../components/AdminDataStatus";

function Stats({ title, entries }) {
  return (
    <section className="monitoring-stats" aria-label={title}>
      {entries.map(([label, value]) => (
        <article key={label} className="monitoring-stat-card">
          <div>
            <p>{label}</p>
            <strong>{value ?? "—"}</strong>
          </div>
        </article>
      ))}
    </section>
  );
}

export default function AdminDashboard({ reports = false }) {
  const resource = useAdminResource(
    reports ? fetchAdminReports : fetchAdminOverview,
  );
  const data = resource.data;
  const mail = data?.mailSummary;
  const organization = data?.organization;
  const capacity = data?.directoryCapacity;
  const distribution = data?.mailboxDistribution || [];
  const maximum = Math.max(
    1,
    ...distribution.map((item) => Number(item.count) || 0),
  );
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>{reports ? "Reports" : "Overview"}</h2>
          <p>
            {reports
              ? "Mailbox distribution and directory capacity."
              : "Your directory, mail activity, and workspace setup."}
          </p>
        </div>
        <button
          className="btn-secondary"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          Refresh {reports ? "reports" : "overview"}
        </button>
      </div>
      <AdminDataStatus {...resource} />
      {data &&
        (reports ? (
          <>
            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              <section className="admin-panel admin-padded">
                <h3 className="mb-5 font-semibold">Mailbox distribution</h3>
                {distribution.map((item) => (
                  <div key={item.folder} className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="capitalize">{item.folder}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${(Math.max(0, Number(item.count) || 0) / maximum) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {!distribution.length && (
                  <p className="text-sm text-slate-500">
                    No mailbox data returned.
                  </p>
                )}
              </section>
              <section className="admin-panel admin-padded">
                <h3 className="mb-5 font-semibold">Directory capacity</h3>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ["Allocated storage (GB)", capacity?.allocatedGb],
                    ["Used storage (GB)", capacity?.usedGb],
                    ["Distribution groups", capacity?.distributedGroups],
                    ["Alternate addresses", capacity?.alternateAddresses],
                  ].map(([label, value]) => (
                    <div key={label} className="contents">
                      <dt className="text-slate-500">{label}</dt>
                      <dd>{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-sm text-slate-500">
                  {capacity?.serverMetricsAvailable === false
                    ? "Server telemetry is unavailable."
                    : capacity?.serverMetricsAvailable === true
                      ? "Server telemetry is available."
                      : "Server telemetry status was not provided."}
                </p>
                {capacity?.message && (
                  <p className="mt-2 text-xs text-slate-500">
                    {capacity.message}
                  </p>
                )}
              </section>
            </div>
            {data.summary && (
              <div className="mt-6">
                <Stats
                  title="Report summary"
                  entries={[
                    ["Users", data.summary.totalUsers],
                    ["Domains", data.summary.totalDomains],
                  ]}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <Stats
              title="Monitoring overview"
              entries={[
                ["Total mail copies", mail?.totalMailCopies],
                ["Inbox copies", mail?.inboxCopies],
                ["Unread messages", mail?.unreadMessages],
                ["With attachments", mail?.withAttachments],
              ]}
            />
            <Stats
              title="Directory overview"
              entries={[
                ["Directory users", organization?.directoryUsers],
                ["Active users", organization?.activeUsers],
                ["Domains", organization?.domains],
                ["Contacts", organization?.contacts],
              ]}
            />
            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              <section className="admin-panel admin-padded">
                <h3 className="mb-4 font-semibold">Workspace setup</h3>
                <p className="text-sm">
                  Directory:{" "}
                  {data.workspaceSetup?.directoryReady === true
                    ? "Ready"
                    : data.workspaceSetup?.directoryReady === false
                      ? "Setup needed"
                      : "Not reported"}
                </p>
                <p className="mt-2 text-sm">
                  Connected users: {data.workspaceSetup?.usersConnected ?? "—"}
                </p>
                <Link className="btn-secondary mt-5" to="/admin/users">
                  Manage users
                </Link>
              </section>
              <section className="admin-panel admin-padded">
                <h3 className="mb-4 font-semibold">Recent mail activity</h3>
                {(data.recentActivity || []).map((item, index) => (
                  <article
                    className="border-b border-slate-100 py-3"
                    key={`${item.receivedAt}/${index}`}
                  >
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {item.sender}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.receivedAt
                        ? new Date(item.receivedAt).toLocaleString()
                        : "—"}
                    </p>
                  </article>
                ))}
                {!data.recentActivity?.length && (
                  <p className="text-sm text-slate-500">No recent activity.</p>
                )}
              </section>
            </div>
          </>
        ))}
    </>
  );
}
