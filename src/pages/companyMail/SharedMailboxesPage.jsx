import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Inbox,
  Search,
  Plus,
  RefreshCw,
  MessageSquare,
  ArrowLeft,
  SlidersHorizontal,
  Mail,
} from "lucide-react";
import useCompanyMail from "../../hooks/useCompanyMail";
import { sharedActions } from "../../redux/thunks/sharedMailboxThunks";
import ReplyComposer from "../../components/sharedMailbox/ReplyComposer";
import ConversationEditor from "../../components/sharedMailbox/ConversationEditor";
import "./SharedMailboxesPage.css";

export default function SharedMailboxesPage() {
  const resource = useCompanyMail("shared", sharedActions);
  const [mailbox, setMailbox] = useState("");
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  function setQuery(value) {
    setParams(
      (previous) => {
        if (value) previous.set("q", value);
        else previous.delete("q");
        return previous;
      },
      { replace: true },
    );
  }
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editor, setEditor] = useState(null);
  const mailboxes = [
    ...new Set(resource.items.map((item) => item.mailbox).filter(Boolean)),
  ];
  const rows = resource.items.filter(
    (item) =>
      (!mailbox || item.mailbox === mailbox) &&
      (!status || item.status === status) &&
      `${item.conversation || ""} ${item.note || ""} ${item.mailbox || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = selectedId
    ? rows.find((item) => item.id === selectedId)
    : rows[0];
  const disabled =
    resource.loading || resource.busy || resource.stale || resource.readFailed;
  function chooseMailbox(value) {
    setMailbox(value);
    setSelectedId(null);
  }
  return (
    <section className="shared-workspace" aria-label="Shared mailbox workspace">
      <header className="shared-page-heading">
        <div>
          <span className="shared-eyebrow">TEAM INBOX</span>
          <h1>Shared Mailboxes</h1>
          <p>One place for your team’s conversations.</p>
        </div>
        <div className="shared-heading-actions">
          <button
            className="btn-secondary"
            disabled={resource.loading || resource.busy}
            onClick={resource.reload}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            className="btn-primary"
            disabled={disabled}
            onClick={() => setEditor({})}
          >
            <Plus size={16} />
            New conversation
          </button>
        </div>
      </header>
      {resource.error && (
        <div role="alert" className="shared-error">
          {resource.error}
          <button
            className="btn-secondary"
            disabled={resource.loading || resource.busy}
            onClick={resource.reload}
          >
            Retry
          </button>
        </div>
      )}
      <div
        className={`shared-inbox-grid ${selectedId && selected ? "shared-detail-open" : ""}`}
      >
        <aside className="shared-mailboxes" aria-label="Team mailboxes">
          <h2>Mailboxes</h2>
          <button
            className={!mailbox ? "selected" : ""}
            onClick={() => chooseMailbox("")}
          >
            <Inbox size={17} />
            <span>All mailboxes</span>
            <small>{resource.items.length}</small>
          </button>
          {mailboxes.map((address) => (
            <button
              key={address}
              className={mailbox === address ? "selected" : ""}
              onClick={() => chooseMailbox(address)}
            >
              <Mail size={16} />
              <span>{address}</span>
              <small>
                {
                  resource.items.filter((item) => item.mailbox === address)
                    .length
                }
              </small>
            </button>
          ))}
          <p>Counts show loaded conversation records, not unread messages.</p>
        </aside>
        <section
          className="shared-conversations"
          aria-label="Conversation list"
        >
          <div className="shared-list-header">
            <h2>{mailbox || "All conversations"}</h2>
            <span>
              {rows.length} loaded · {resource.total ?? "—"} total
            </span>
            <select
              className="field shared-mobile-mailbox"
              aria-label="Choose mailbox"
              value={mailbox}
              onChange={(event) => chooseMailbox(event.target.value)}
            >
              <option value="">All mailboxes</option>
              {mailboxes.map((address) => (
                <option key={address}>{address}</option>
              ))}
            </select>
            <label className="shared-search">
              <Search size={16} />
              <input
                aria-label="Search conversations"
                placeholder="Search conversations"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedId(null);
                }}
              />
            </label>
            <select
              className="field"
              aria-label="Conversation status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setSelectedId(null);
              }}
            >
              <option value="">All statuses</option>
              {[
                ...new Set(
                  resource.items.map((item) => item.status).filter(Boolean),
                ),
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="shared-conversation-scroll">
            {resource.loading && (
              <p role="status" className="shared-empty">
                Loading conversations…
              </p>
            )}
            {!resource.loading &&
              rows.map((item) => (
                <button
                  key={item.id}
                  className={`shared-conversation ${selected?.id === item.id ? "active" : ""}`}
                  aria-pressed={selected?.id === item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="shared-conversation-top">
                    <strong>{item.conversation || "Unknown contact"}</strong>
                    <span className="shared-status">
                      {item.status || "Not reported"}
                    </span>
                  </span>
                  <span className="shared-subject">
                    {item.note || "No context note"}
                  </span>
                  <span className="shared-mailbox-address">{item.mailbox}</span>
                </button>
              ))}
            {!resource.loading && !rows.length && (
              <div className="shared-empty">
                <Inbox size={30} />
                <h3>
                  {resource.error
                    ? "Unable to load conversations"
                    : "No conversations found"}
                </h3>
                <p>
                  {query || status || mailbox
                    ? "Try another mailbox or clear your filters."
                    : "New conversation records will appear here."}
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="shared-thread" aria-label="Conversation workspace">
          {selected ? (
            <>
              <header className="shared-thread-header">
                <button
                  className="btn-secondary shared-back"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
                <div>
                  <h2>{selected.conversation || "Conversation"}</h2>
                  <p>{selected.mailbox}</p>
                </div>
                <button
                  className="btn-secondary"
                  disabled={disabled}
                  onClick={() => setEditor({ record: selected })}
                >
                  <SlidersHorizontal size={15} />
                  Settings
                </button>
              </header>
              <div className="shared-thread-meta">
                <span className="shared-status">
                  {selected.status || "Status not reported"}
                </span>
                <span>Access: {selected.access || "Not reported"}</span>
                <span>Requests: {selected.requests ?? "—"}</span>
              </div>
              <div className="shared-thread-scroll">
                <article className="shared-context">
                  <h3>Conversation context</h3>
                  <p>{selected.note || "No context note provided."}</p>
                  <span>This is a record note, not an email message.</span>
                </article>
                <div className="shared-history-empty">
                  <span className="shared-history-icon">
                    <MessageSquare size={24} />
                  </span>
                  <h3>Message history isn’t connected yet</h3>
                  <p>
                    This mailbox currently provides conversation records. Actual
                    messages, team chat, and sent replies will appear here once
                    conversation messaging is connected.
                  </p>
                </div>
              </div>
              <ReplyComposer conversation={selected} />
            </>
          ) : (
            <div className="shared-empty shared-select">
              <MessageSquare size={34} />
              <h2>Select a conversation</h2>
              <p>Choose a record to review its context and prepare a reply.</p>
            </div>
          )}
        </section>
      </div>
      {editor && (
        <ConversationEditor
          resource={resource}
          record={editor.record}
          onClose={() => setEditor(null)}
        />
      )}
    </section>
  );
}
