import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { FolderPlus, Tag, Trash2 } from "lucide-react";
import { normalizeSettings, settingsPayload } from "../utils/settings";
import { fetchSettings, saveSettings } from "../redux/thunks/settingsThunks";
import { reportError } from "../utils/errors";
import {
  createFolder,
  deleteFolder,
  createLabel,
  deleteLabel,
  fetchFolders,
} from "../redux/thunks/mailThunks";
import { notify } from "../redux/slice/uiSlice";
import { systemFolders } from "../utils/mail";
import { IconButton } from "../components/Ui";
import ConfirmDialog from "../components/ConfirmDialog";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [load, setLoad] = useState({ loading: true, error: null });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    const operation = dispatch(fetchSettings());
    operation.unwrap().then(
      () => {
        if (active) setLoad({ loading: false, error: null });
      },
      (error) => {
        if (active) setLoad({ loading: false, error });
      },
    );
    return () => {
      active = false;
      operation.abort();
    };
  }, [dispatch, revision]);
  if (load.loading)
    return (
      <p role="status" className="p-8">
        Loading settings…
      </p>
    );
  if (load.error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p role="alert" className="my-4 text-red-600">
          {load.error.message}
        </p>
        <button
          className="btn-secondary"
          onClick={() => {
            setLoad({ loading: true, error: null });
            setRevision((value) => value + 1);
          }}
        >
          Retry settings
        </button>
      </div>
    );
  return <SettingsEditor />;
}

function SettingsEditor() {
  const settings = useSelector((state) => state.settings);
  const { labels, customFolders, folders } = useSelector((state) => state.mail);
  const [form, setForm] = useState(() => normalizeSettings(settings));
  const [name, setName] = useState("");
  const [kind, setKind] = useState("folder");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const dispatch = useDispatch();
  const { hash } = useLocation();
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  async function execute(action) {
    setBusy(true);
    try {
      await dispatch(action).unwrap();
      await dispatch(fetchFolders()).unwrap();
      return true;
    } catch (error) {
      reportError(dispatch, error);
      return false;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (hash === "#organization")
      document
        .getElementById("organization")
        ?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);
  const dirty =
    JSON.stringify(form) !== JSON.stringify(normalizeSettings(settings));
  async function add(event) {
    event.preventDefault();
    const clean = name.trim();
    const existing = [
      ...systemFolders,
      ...customFolders,
      ...labels.map((l) => l.name),
    ];
    if (!clean || clean.length > 30 || /[/:?#]/.test(clean)) {
      setError("Use 1–30 characters without /, :, ?, or #.");
      return;
    }
    if (existing.some((value) => value.toLowerCase() === clean.toLowerCase())) {
      setError("That name is already in use.");
      return;
    }
    const saved = await execute(
      kind === "folder"
        ? createFolder(clean)
        : createLabel({
            name: clean,
            color: "#8b5cf6",
          }),
    );
    if (saved === false) return;
    setName("");
    setError("");
    dispatch(
      notify({ text: `${kind === "folder" ? "Folder" : "Label"} created.` }),
    );
  }
  return (
    <div className="thin-scrollbar flex-1 overflow-y-auto p-5 sm:p-8">
      <fieldset disabled={busy} className="w-full">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">
          Make your workspace work for you.
        </p>
        <form
          className="space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setSaveError("");
            try {
              const before = settingsPayload(normalizeSettings(settings));
              const changes = Object.fromEntries(
                Object.entries(settingsPayload(form)).filter(
                  ([key, value]) => value !== before[key],
                ),
              );
              const saved = await dispatch(saveSettings(changes)).unwrap();
              setForm(normalizeSettings(saved));
              dispatch(notify({ text: "Preferences saved." }));
            } catch (error) {
              setSaveError(error.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <section className="card">
            <h2 className="mb-5 font-semibold">Inbox preferences</h2>
            {[
              [
                "compact",
                "Compact message list",
                "Fit more conversations on your screen.",
              ],
              [
                "markReadOnOpen",
                "Mark as read when opened",
                "Opening a message clears its unread indicator.",
              ],
              [
                "confirmTrash",
                "Confirm before moving to Trash",
                "Show a confirmation for individual and bulk trash actions.",
              ],
            ].map(([key, title, description]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 border-b border-slate-100 py-4"
              >
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-1 block text-xs text-slate-400">
                    {description}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="size-4"
                  checked={form[key]}
                  onChange={(event) =>
                    setForm({ ...form, [key]: event.target.checked })
                  }
                />
              </label>
            ))}
            <label className="mt-5 flex items-center justify-between gap-4 text-sm">
              Messages per page
              <select
                className="field w-24"
                value={form.pageSize}
                onChange={(event) =>
                  setForm({ ...form, pageSize: Number(event.target.value) })
                }
              >
                {[...new Set([10, 20, 25, 50, 100, form.pageSize])]
                  .sort((a, b) => a - b)
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
          </section>
          <section className="card">
            <h2 className="font-semibold">Email signature</h2>
            <p className="mb-5 mt-2 text-xs text-slate-400">
              Automatically included in new messages and replies.
            </p>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.useSignature}
                onChange={(event) =>
                  setForm({ ...form, useSignature: event.target.checked })
                }
              />
              Use my signature
            </label>
            <textarea
              aria-label="Email signature"
              maxLength={1500}
              className="field min-h-32"
              value={form.signature}
              onChange={(event) =>
                setForm({ ...form, signature: event.target.value })
              }
            />
          </section>
          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={!dirty}
              className="btn-secondary"
              onClick={() => {
                setForm(normalizeSettings(settings));
                setSaveError("");
              }}
            >
              Cancel changes
            </button>
            <button disabled={!dirty} className="btn-primary">
              Save preferences
            </button>
          </div>
        </form>
        <section id="organization" className="card mt-8 scroll-mt-5">
          <h2 className="font-semibold">Folders & labels</h2>
          <p className="mb-5 mt-2 text-xs text-slate-400">
            Organize messages with custom folders and labels.
          </p>
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <select
              aria-label="Create folder or label"
              className="field w-28"
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setError("");
              }}
            >
              <option value="folder">Folder</option>
              <option value="label">Label</option>
            </select>
            <input
              aria-label="New folder or label name"
              className="field min-w-32 flex-1"
              placeholder="Enter a name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              required
            />
            <button className="btn-primary">Add</button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="mt-6 space-y-1">
            {[
              ...customFolders.map((name) => ({ name, kind: "folder" })),
              ...labels.map((label) => ({ ...label, kind: "label" })),
            ].map((item) => (
              <div
                key={item.kind + item.name}
                className="flex items-center gap-3 rounded-lg border-b border-slate-100 py-2"
              >
                {item.kind === "folder" ? (
                  <FolderPlus size={16} className="text-slate-400" />
                ) : (
                  <Tag size={16} className="text-brand-500" />
                )}
                <span className="text-sm">{item.name}</span>
                <span className="ml-auto text-xs text-slate-400">
                  {item.kind}
                </span>
                <IconButton
                  icon={Trash2}
                  label={`Delete ${item.kind} ${item.name}`}
                  onClick={() => setConfirm(item)}
                />
              </div>
            ))}
          </div>
        </section>
      </fieldset>
      {confirm && (
        <ConfirmDialog
          title={`Delete ${confirm.kind}?`}
          description={
            confirm.kind === "folder"
              ? `Messages in “${confirm.name}” will move to Inbox. No messages will be deleted.`
              : `The label “${confirm.name}” will be removed from all messages.`
          }
          confirmLabel="Delete"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const saved = await execute(
              confirm.kind === "folder"
                ? deleteFolder(
                    folders.find(
                      (folder) =>
                        folder.name === confirm.name &&
                        folder.kind === "custom",
                    ).id,
                  )
                : deleteLabel(
                    labels.find((label) => label.name === confirm.name).id,
                  ),
            );
            if (saved === false) return;
            setConfirm(null);
            dispatch(notify({ text: "Organization updated." }));
          }}
        />
      )}
    </div>
  );
}
