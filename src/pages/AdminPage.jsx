import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  fetchAdminSection,
  createUser,
  updateUser,
  syncContacts,
} from "../redux/thunks/adminThunks";
import Dialog from "../components/Dialog";
const sections = ["users", "inbound-log", "zoho-sync"];
export default function AdminPage({
  section: suppliedSection,
  embedded = false,
}) {
  const { section } = useParams();
  return (
    <Admin
      key={suppliedSection || section}
      section={suppliedSection || section}
      embedded={embedded}
    />
  );
}
function Admin({ section, embedded }) {
  const dispatch = useDispatch();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    dispatch(fetchAdminSection(section))
      .unwrap()
      .then((data) => {
        if (active) {
          setItems(data.items);
          setStatus(data.sync || null);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [dispatch, section, version]);
  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      setEditor(null);
      setVersion((v) => v + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e) {
    e.preventDefault();
    await run(async () => {
      const body = {
        displayName: editor.displayName,
        role: editor.role,
        recoveryEmail: editor.recoveryEmail || null,
        ...(editor.password ? { password: editor.password } : {}),
      };
      if (editor.id)
        await dispatch(
          updateUser({
            id: editor.id,
            body: {
              ...body,
              isActive: editor.isActive,
            },
          }),
        ).unwrap();
      else
        await dispatch(createUser({ ...body, email: editor.email })).unwrap();
    });
  }
  return (
    <div className={embedded ? "min-w-0" : "flex-1 overflow-auto p-6"}>
      {!embedded && (
        <>
          <h1 className="text-2xl font-semibold">Administration</h1>
          <nav className="my-5 flex flex-wrap gap-3">
            {sections.map((s) => (
              <Link
                className="btn-secondary capitalize"
                key={s}
                to={`/admin/${s}`}
              >
                {s.replaceAll("-", " ")}
              </Link>
            ))}
          </nav>
        </>
      )}
      {embedded && (
        <h2 className="mb-5 text-xl font-semibold capitalize">
          {section.replaceAll("-", " ")}
        </h2>
      )}
      {!sections.includes(section) && (
        <p className="card">
          {section === "overview"
            ? "Manage mailbox users, inbound processing, and contact synchronization using the sections above."
            : "This feature has no endpoint in the supplied backend. It is unavailable in connected mode."}
        </p>
      )}
      {error && (
        <p role="alert" className="my-4 text-red-600">
          {error}
        </p>
      )}
      <fieldset disabled={busy} className="space-y-4">
        {section === "users" && (
          <button
            className="btn-primary"
            onClick={() =>
              setEditor({
                email: "",
                displayName: "",
                password: "",
                recoveryEmail: "",
                role: "member",
                isActive: true,
              })
            }
          >
            Create user
          </button>
        )}
        {items.map((item, index) => (
          <article
            className="card space-y-2"
            key={item.id || item.ses_message_id || index}
          >
            {section === "users" && (
              <>
                <h2 className="font-semibold">{item.displayName}</h2>
                <p>
                  {item.email} Â· {item.role} Â·{" "}
                  {item.isActive ? "Active" : "Inactive"}
                </p>
                <button
                  className="btn-secondary"
                  onClick={() => setEditor({ ...item, password: "" })}
                >
                  Edit {item.email}
                </button>
              </>
            )}
            {section === "inbound-log" && (
              <>
                <h2>
                  {item.status} Â· {item.processed_at}
                </h2>
                <pre className="whitespace-pre-wrap break-all text-xs">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </>
            )}
          </article>
        ))}
        {section === "zoho-sync" && (
          <div className="card">
            <pre className="mb-4 whitespace-pre-wrap">
              {JSON.stringify(status, null, 2)}
            </pre>
            <button
              className="btn-primary"
              onClick={() =>
                run(async () =>
                  setStatus(await dispatch(syncContacts()).unwrap()),
                )
              }
            >
              Synchronize contacts
            </button>
          </div>
        )}
      </fieldset>
      {editor && (
        <Dialog
          title="Mailbox user"
          onClose={() => {
            if (!busy) setEditor(null);
          }}
        >
          <form className="space-y-4 p-6" onSubmit={save}>
            <fieldset disabled={busy} className="space-y-4">
              {[
                ["displayName", "Display name", "text"],
                ["email", "Email", "email"],
                ["recoveryEmail", "Recovery email", "email"],
                [
                  "password",
                  editor.id ? "New password (optional)" : "Password",
                  "password",
                ],
              ].map(([key, label, type]) => (
                <label className="block" key={key}>
                  {label}
                  <input
                    className="field"
                    type={type}
                    value={editor[key] || ""}
                    readOnly={
                      section === "users" && key === "email" && !!editor.id
                    }
                    required={
                      key !== "recoveryEmail" &&
                      !(key === "password" && editor.id)
                    }
                    minLength={key === "password" ? 10 : undefined}
                    onChange={(e) =>
                      setEditor({ ...editor, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              {section === "users" && (
                <>
                  <label className="block">
                    Role
                    <select
                      className="field"
                      value={editor.role}
                      onChange={(e) =>
                        setEditor({ ...editor, role: e.target.value })
                      }
                    >
                      <option value="member">Member</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </label>
                  {editor.id && (
                    <label>
                      <input
                        type="checkbox"
                        checked={editor.isActive}
                        onChange={(e) =>
                          setEditor({ ...editor, isActive: e.target.checked })
                        }
                      />{" "}
                      Active
                    </label>
                  )}
                </>
              )}
              {error && (
                <p role="alert" className="text-red-600">
                  {error}
                </p>
              )}
              <button className="btn-primary">Save</button>
            </fieldset>
          </form>
        </Dialog>
      )}
    </div>
  );
}
