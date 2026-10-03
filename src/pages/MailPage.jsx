import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { FolderInput, Paperclip, ShieldAlert, Trash2 } from "lucide-react";
import { composeOpened, notify } from "../redux/slice/uiSlice";
import {
  deleteMessages,
  messageRead,
  toggleStar,
  updateMessages,
} from "../redux/slice/mailSlice";
import {
  belongsToFolder,
  filterMessages,
  replyRecipients,
  systemFolders,
} from "../utils/mail";
import MailList from "../components/MailList";
import MessageView from "../components/MessageView";
import ConfirmDialog from "../components/ConfirmDialog";

export default function MailPage() {
  const { folder } = useParams();
  const [params, setParams] = useSearchParams();
  return (
    <Mailbox
      key={`${folder}:${params.get("q") || ""}`}
      folder={folder}
      params={params}
      setParams={setParams}
    />
  );
}

function Mailbox({ folder, params, setParams }) {
  const dispatch = useDispatch();
  const { messages, labels, customFolders } = useSelector(
    (state) => state.mail,
  );
  const settings = useSelector((state) => state.settings);
  const profile = useSelector((state) => state.profile);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [attachments, setAttachments] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const query = params.get("q") || "";
  const activeId = params.get("message");
  const validFolder =
    systemFolders.includes(folder) ||
    customFolders.includes(folder) ||
    labels.some((label) => "label:" + label.name === folder);
  const filtered = filterMessages(messages, {
    folder,
    query,
    filter,
    sort,
    attachments,
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / settings.pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * settings.pageSize,
    currentPage * settings.pageSize,
  );
  const active = messages.find(
    (m) => m.id === activeId && belongsToFolder(m, folder),
  );
  const selectedIds = selected.filter((id) =>
    filtered.some((m) => m.id === id),
  );
  function close() {
    setParams(
      (previous) => {
        previous.delete("message");
        return previous;
      },
      { replace: true },
    );
  }
  function open(message) {
    if (message.folder === "Drafts") {
      dispatch(composeOpened(message));
      return;
    }
    setParams(
      (previous) => {
        previous.set("message", message.id);
        return previous;
      },
      { replace: true },
    );
    if (settings.markReadOnOpen) dispatch(messageRead(message.id));
  }
  function perform(type, ids) {
    if (type === "delete") dispatch(deleteMessages(ids));
    else
      dispatch(
        updateMessages({
          ids,
          changes:
            type === "read" || type === "unread"
              ? { unread: type === "unread" }
              : { folder: type },
        }),
      );
    setSelected([]);
    close();
    setConfirm(null);
    dispatch(
      notify({
        text:
          type === "delete"
            ? `${ids.length} message(s) permanently deleted.`
            : type === "read" || type === "unread"
              ? `${ids.length} message(s) marked ${type}.`
              : `${ids.length} message(s) moved to ${type}.`,
        undo: type !== "delete",
      }),
    );
  }
  function action(type, ids = selectedIds) {
    if (!ids.length) return;
    if (type === "delete" || (type === "Trash" && settings.confirmTrash)) {
      setConfirm({ type, ids });
      return;
    }
    perform(type, ids);
  }
  function compose(mode, message) {
    const signature = settings.useSignature ? `\n\n${settings.signature}` : "";
    if (mode === "forward")
      dispatch(
        composeOpened({
          subject: `Fwd: ${message.subject}`,
          body: `${signature}\n\n---------- Forwarded message ----------\nFrom: ${message.email}\nTo: ${message.to || profile.email}\nSubject: ${message.subject}\n\n${message.body}`,
          attachments: message.attachments,
        }),
      );
    else
      dispatch(
        composeOpened({
          to: replyRecipients(message, profile.email, mode === "replyAll"),
          subject: /^re:/i.test(message.subject)
            ? message.subject
            : `Re: ${message.subject}`,
          body: `${signature}\n\nOn ${new Date(message.date).toLocaleDateString()}, ${message.sender} wrote:\n> ${message.body.replace(/\n/g, "\n> ")}`,
        }),
      );
  }
  if (!validFolder)
    return (
      <div className="m-auto p-8 text-center">
        <h1 className="text-xl font-semibold">Folder not found</h1>
        <Link className="btn-primary mt-5" to="/mail/Inbox">
          Back to inbox
        </Link>
      </div>
    );
  const actionIds = selectedIds.length
    ? selectedIds
    : active
      ? [active.id]
      : [];
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 bg-white px-4 py-2">
        <button
          aria-pressed={attachments}
          onClick={() => {
            setAttachments(!attachments);
            setPage(1);
            setSelected([]);
          }}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs ${attachments ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Paperclip size={14} />
          Has attachment
        </button>
        <div className="h-4 border-l border-slate-200" />
        <FolderInput size={15} className="text-slate-400" />
        <select
          aria-label="Move messages to folder"
          disabled={!actionIds.length}
          value=""
          onChange={(event) => action(event.target.value, actionIds)}
          className="max-w-36 rounded-md bg-transparent p-1 text-xs text-slate-500 disabled:opacity-40"
        >
          <option value="" disabled>
            Move to…
          </option>
          {["Inbox", "Archive", ...customFolders, "Spam", "Trash"].map(
            (name) => (
              <option key={name}>{name}</option>
            ),
          )}
        </select>
        <select
          aria-label="Apply label to messages"
          disabled={!actionIds.length}
          value=""
          onChange={(event) => {
            dispatch(
              updateMessages({
                ids: actionIds,
                changes: {
                  label:
                    event.target.value === "__none" ? "" : event.target.value,
                },
              }),
            );
            dispatch(notify({ text: "Labels updated.", undo: true }));
            setSelected([]);
          }}
          className="max-w-32 rounded-md bg-transparent p-1 text-xs text-slate-500 disabled:opacity-40"
        >
          <option value="" disabled>
            Label…
          </option>
          <option value="__none">Remove label</option>
          {labels.map((label) => (
            <option key={label.name}>{label.name}</option>
          ))}
        </select>
        <button
          disabled={!actionIds.length}
          onClick={() =>
            action(folder === "Spam" ? "Inbox" : "Spam", actionIds)
          }
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
        >
          <ShieldAlert size={14} />
          {folder === "Spam" ? "Not spam" : "Spam"}
        </button>
        {folder === "Trash" && (
          <button
            disabled={!messages.some((m) => m.folder === "Trash")}
            onClick={() =>
              action(
                "delete",
                actionIds.length
                  ? actionIds
                  : messages
                      .filter((m) => m.folder === "Trash")
                      .map((m) => m.id),
              )
            }
            className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            {actionIds.length ? "Delete forever" : "Empty trash"}
          </button>
        )}
      </div>
      <div className="mailbox-layout relative flex min-h-0 flex-1 overflow-hidden">
        <MailList
          messages={visible}
          total={filtered.length}
          folder={folder.replace(/^label:/, "")}
          filter={filter}
          setFilter={(value) => {
            setFilter(value);
            setPage(1);
            setSelected([]);
            close();
          }}
          activeId={activeId}
          onOpen={open}
          selected={selectedIds}
          onSelect={(id) =>
            setSelected((previous) =>
              previous.includes(id)
                ? previous.filter((value) => value !== id)
                : [...previous, id],
            )
          }
          onSelectAll={() =>
            setSelected(
              visible.every((m) => selectedIds.includes(m.id))
                ? selectedIds.filter((id) => !visible.some((m) => m.id === id))
                : [...new Set([...selectedIds, ...visible.map((m) => m.id)])],
            )
          }
          onStar={(id) => dispatch(toggleStar(id))}
          onAction={action}
          compact={settings.compact}
          sort={sort}
          onSort={() => {
            setSort(sort === "newest" ? "oldest" : "newest");
            setPage(1);
          }}
          page={currentPage}
          pageSize={settings.pageSize}
          setPage={(value) => {
            setPage(value);
            setSelected([]);
          }}
          pageCount={pageCount}
          reading={Boolean(active)}
        />
        <MessageView
          message={active}
          onClose={close}
          onAction={action}
          onStar={(id) => dispatch(toggleStar(id))}
          onCompose={compose}
          onLabel={(id, label) => {
            dispatch(updateMessages({ ids: [id], changes: { label } }));
            dispatch(notify({ text: "Label updated.", undo: true }));
          }}
        />
      </div>
      {confirm && (
        <ConfirmDialog
          title={
            confirm.type === "delete"
              ? "Permanently delete messages?"
              : "Move messages to Trash?"
          }
          description={
            confirm.type === "delete"
              ? `${confirm.ids.length} message(s) and their attachments will be permanently removed. This cannot be undone.`
              : `${confirm.ids.length} message(s) will move to Trash. You can restore them later.`
          }
          confirmLabel={
            confirm.type === "delete" ? "Delete forever" : "Move to Trash"
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => perform(confirm.type, confirm.ids)}
        />
      )}
    </>
  );
}
