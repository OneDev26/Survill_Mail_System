import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import {
  fetchMessages,
  fetchMessage,
  fetchFolders,
  bulkUpdateMessages,
  deleteMessages,
  emptyFolder,
} from "../redux/thunks/mailThunks";
import { folderName, messageModel } from "../api/models";
import { reportError } from "../utils/errors";
import { composeOpened, notify } from "../redux/slice/uiSlice";
import MailList from "../components/MailList";
import MessageView from "../components/MessageView";
import ConfirmDialog from "../components/ConfirmDialog";

export default function MailPage() {
  const { folder } = useParams();
  const [params] = useSearchParams();
  return (
    <Mailbox
      key={`${folder}:${params.get("q") || ""}`}
      folder={folder}
      query={params.get("q") || ""}
    />
  );
}
function Mailbox({ folder, query }) {
  const dispatch = useDispatch();
  const mail = useSelector((s) => s.mail);
  const settings = useSelector((s) => s.settings);
  const ownEmail = useSelector((s) => s.profile.email);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [attachments, setAttachments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [version, setVersion] = useState(0);
  const folderId =
    folder === "Starred"
      ? "starred"
      : mail.folders.find((f) => folderName(f) === folder)?.id;
  const labelId = folder.startsWith("label:")
    ? mail.labels.find((l) => l.name === folder.slice(6))?.id
    : undefined;
  useEffect(() => {
    let cancelled = false;
    let request;
    const timer = setTimeout(() => {
      if (!folderId && !labelId) {
        setError("Folder not available on the server.");
        return;
      }
      setBusy(true);
      setError("");
      request = dispatch(
        fetchMessages({
          folder: labelId ? "all" : folderId,
          label: labelId,
          q: query || undefined,
          page,
          pageSize: settings.pageSize,
          sort,
          unread: filter === "Unread" ? true : undefined,
          starred: filter === "Starred" ? true : undefined,
          hasAttachments: attachments || undefined,
        }),
      );
      request
        .unwrap()
        .then((data) => {
          if (!cancelled) {
            setResult(data);
            setSelected([]);
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setBusy(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      request?.abort();
    };
  }, [
    dispatch,
    folderId,
    labelId,
    query,
    page,
    settings.pageSize,
    sort,
    filter,
    attachments,
    version,
    mail.revision,
  ]);
  const messages = result.items.map((m) =>
    messageModel(m, mail.folders, mail.labels),
  );
  async function open(message) {
    try {
      const data = await dispatch(
        fetchMessage({ id: message.id, markRead: settings.markReadOnOpen }),
      ).unwrap();
      const detail = messageModel(data.message, mail.folders, mail.labels);
      if (detail.isDraft) dispatch(composeOpened(detail));
      else setActive(detail);
      setVersion((v) => v + 1);
      await dispatch(fetchFolders()).unwrap();
    } catch (err) {
      reportError(dispatch, err);
    }
  }
  async function perform(type, ids, extra = {}) {
    setBusy(true);
    try {
      if (type === "delete") await dispatch(deleteMessages(ids)).unwrap();
      else if (type === "empty")
        await dispatch(emptyFolder(folder.toLowerCase())).unwrap();
      else {
        await dispatch(
          bulkUpdateMessages({ ids, action: type, ...extra }),
        ).unwrap();
      }
      setActive(null);
      setSelected([]);
      setConfirm(null);
      setVersion((v) => v + 1);
      await dispatch(fetchFolders()).unwrap();
      dispatch(
        notify({
          text: "Mailbox updated.",
          undo: !["delete", "empty", "addLabels", "removeLabels"].includes(
            type,
          ),
        }),
      );
    } catch (err) {
      reportError(dispatch, err);
    } finally {
      setBusy(false);
    }
  }
  function action(type, ids = selected) {
    if (!ids.length) return;
    const mapping = {
      Inbox:
        folder === "Spam" ? "notSpam" : folder === "Trash" ? "restore" : "move",
      Archive: "archive",
      Trash: "trash",
      Spam: "spam",
    };
    const action = mapping[type] || type;
    const extra = action === "move" ? { folderId: "inbox" } : {};
    if (action === "delete" || (action === "trash" && settings.confirmTrash))
      setConfirm({ action, ids, extra });
    else perform(action, ids, extra);
  }
  function compose(mode, message) {
    const forward = mode === "forward";
    const recipients = [
      ...new Set(
        [
          message.replyTo || message.email,
          ...(mode === "replyAll" ? [message.to, message.cc] : []),
        ]
          .flatMap((v) => (v || "").split(","))
          .map((s) => s.trim())
          .filter((s) => s && s.toLowerCase() !== ownEmail.toLowerCase()),
      ),
    ];
    dispatch(
      composeOpened({
        to: forward ? "" : recipients.join(", "),
        subject: `${forward ? "Fwd" : "Re"}: ${message.subject}`,
        body: `${settings.useSignature ? settings.signature : ""}\n\nOn ${message.date}, ${message.sender} wrote:\n${message.body}`,
        ...(forward
          ? { forwardOfMessageId: message.id }
          : { replyToMessageId: message.id }),
      }),
    );
  }
  const ids = selected.length ? selected : active ? [active.id] : [];
  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200/70 p-3 text-xs">
        <button
          className="btn-secondary h-10 whitespace-nowrap"
          disabled={busy}
          onClick={() => setVersion((v) => v + 1)}
        >
          Refresh mailbox
        </button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap px-2">
          <input
            className="m-0 size-4 shrink-0"
            type="checkbox"
            checked={attachments}
            onChange={(e) => {
              setAttachments(e.target.checked);
              setPage(1);
            }}
          />
          Has attachment
        </label>
        <select
          className="mailbox-toolbar-control max-w-full"
          aria-label="Move messages to folder"
          value=""
          disabled={busy || !ids.length}
          onChange={(e) => perform("move", ids, { folderId: e.target.value })}
        >
          <option value="">Move to…</option>
          {mail.folders
            .filter((f) => f.kind !== "drafts")
            .map((f) => (
              <option key={f.id} value={f.id}>
                {folderName(f)}
              </option>
            ))}
        </select>
        <select
          className="mailbox-toolbar-control max-w-full"
          aria-label="Apply label to messages"
          value=""
          disabled={busy || !ids.length}
          onChange={(e) =>
            perform("addLabels", ids, { labelIds: [e.target.value] })
          }
        >
          <option value="">Add label…</option>
          {mail.labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <button
          className="mailbox-toolbar-control"
          disabled={busy || !ids.length}
          onClick={() => action(folder === "Spam" ? "Inbox" : "Spam", ids)}
        >
          {folder === "Spam" ? "Not spam" : "Spam"}
        </button>
        {["Trash", "Spam"].includes(folder) && (
          <>
            <button
              className="mailbox-toolbar-control"
              disabled={busy || !ids.length}
              onClick={() => action("delete", ids)}
            >
              Delete forever
            </button>
            <button
              className="mailbox-toolbar-control"
              disabled={busy}
              onClick={() => setConfirm({ action: "empty", ids: [] })}
            >
              Empty {folder.toLowerCase()}
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="p-3 text-red-600">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="px-3 text-xs">
          Updating mailbox…
        </p>
      )}
      <div
        className="mailbox-layout relative flex min-h-0 flex-1 overflow-hidden"
        inert={busy || undefined}
      >
        <MailList
          messages={messages}
          total={result.total}
          folder={folder.replace(/^label:/, "")}
          filter={filter}
          setFilter={(value) => {
            setFilter(value);
            setPage(1);
          }}
          activeId={active?.id}
          onOpen={open}
          selected={selected}
          onSelect={(id) =>
            setSelected((old) =>
              old.includes(id) ? old.filter((v) => v !== id) : [...old, id],
            )
          }
          onSelectAll={() =>
            setSelected(
              selected.length === messages.length
                ? []
                : messages.map((m) => m.id),
            )
          }
          onStar={(id) => {
            const m = messages.find((m) => m.id === id);
            perform(m.starred ? "unstar" : "star", [id]);
          }}
          onAction={action}
          compact={settings.compact}
          sort={sort}
          onSort={() => {
            setSort(sort === "newest" ? "oldest" : "newest");
            setPage(1);
          }}
          page={page}
          pageSize={settings.pageSize}
          setPage={setPage}
          pageCount={result.totalPages}
          reading={!!active}
        />
        <MessageView
          message={active}
          onClose={() => setActive(null)}
          onAction={action}
          onStar={(id) => perform(active.starred ? "unstar" : "star", [id])}
          onCompose={compose}
          onLabel={(id, name) => {
            const label = mail.labels.find((l) => l.name === name);
            if (label) perform("addLabels", [id], { labelIds: [label.id] });
            else if (active.labelIds.length)
              perform("removeLabels", [id], { labelIds: active.labelIds });
          }}
        />
      </div>
      {confirm && (
        <ConfirmDialog
          title="Confirm mailbox change"
          description={
            confirm.action === "trash"
              ? "Move these messages to Trash?"
              : "Permanently delete these messages and attachments? This cannot be undone."
          }
          confirmLabel="Confirm"
          onClose={() => setConfirm(null)}
          onConfirm={() => perform(confirm.action, confirm.ids, confirm.extra)}
        />
      )}
    </>
  );
}
