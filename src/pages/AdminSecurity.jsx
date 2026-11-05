import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  fetchAdminSecurity,
  updateAdminSecurity,
} from "../redux/thunks/adminThunks";
import { notify } from "../redux/slice/uiSlice";
import useAdminResource from "../hooks/useAdminResource";
import AdminDataStatus from "../components/AdminDataStatus";

const toggles = [
  ["requireMfa", "Require multi-factor authentication"],
  ["allowExternalForwarding", "Allow external forwarding"],
  ["allowImapAccess", "Allow IMAP access"],
  ["allowPopAccess", "Allow POP access"],
];
const numbers = [
  ["sessionDurationMinutes", "Session duration (minutes)"],
  ["minimumPasswordLength", "Minimum password length"],
  ["retentionPeriodDays", "Retention period (days)"],
];

function SecurityForm({ item, onSaved }) {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      [...toggles, ...numbers].map(([key]) => [key, item[key]]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event) {
    event.preventDefault();
    setError("");
    if (
      numbers.some(
        ([key]) => !Number.isSafeInteger(draft[key]) || draft[key] < 1,
      )
    ) {
      setError("Enter a positive whole number for each numeric setting.");
      return;
    }
    setBusy(true);
    try {
      await dispatch(updateAdminSecurity(draft)).unwrap();
      dispatch(notify({ text: "Security settings saved." }));
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-panel admin-padded admin-settings" onSubmit={save}>
      <fieldset disabled={busy}>
        <h3>Access policies</h3>
        {toggles.map(([key, label]) => (
          <label className="admin-toggle" key={key}>
            <span>
              <strong>{label}</strong>
            </span>
            <input
              type="checkbox"
              checked={draft[key] === true}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
            />
          </label>
        ))}
        <h3 className="mt-6">Session &amp; data policy</h3>
        <div className="admin-settings-grid">
          {numbers.map(([key, label]) => (
            <label key={key}>
              <span className="field-label">{label}</span>
              <input
                className="field"
                type="number"
                min="1"
                step="1"
                required
                value={draft[key] ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    [key]: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button className="btn-primary">
            {busy ? "Saving…" : "Save configuration"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              setDraft(
                Object.fromEntries(
                  [...toggles, ...numbers].map(([key]) => [key, item[key]]),
                ),
              );
              setError("");
            }}
          >
            Discard changes
          </button>
        </div>
      </fieldset>
    </form>
  );
}
export default function AdminSecurity() {
  const resource = useAdminResource(fetchAdminSecurity);
  return (
    <>
      <div className="admin-section-heading">
        <div>
          <h2>Security &amp; retention</h2>
          <p>
            Configure account access, session duration, and retention settings.
          </p>
        </div>
      </div>
      <AdminDataStatus {...resource} />
      {!resource.loading && !resource.error && resource.data?.item && (
        <SecurityForm
          key={JSON.stringify(resource.data.item)}
          item={resource.data.item}
          onSaved={resource.reload}
        />
      )}
    </>
  );
}
