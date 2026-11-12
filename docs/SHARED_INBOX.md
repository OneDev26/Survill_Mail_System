# Shared inbox interface

The Shared Mailboxes route now has mailbox navigation, a searchable/filterable conversation list, a context/detail panel, and per-conversation reply drafts. Desktop uses three panes; narrower screens use a mailbox selector, and mobile switches between list/detail with a Back button. The application mail search remains scoped to this route while it is open.

## Existing API integration

GET/POST `/api/shared-mailboxes` and PATCH `/api/shared-mailboxes/:id` use the dedicated `sharedMailboxesApi`, `sharedActions`, and `sharedMailboxSlice`. Create sends mailbox/conversation/status/access and an optional note. Settings update only status/access, including the documented `rejected` status. API errors preserve edits; successful writes refresh from the server. Mailbox counts describe loaded records, not unread counts. No sample conversations are generated.

The documented `conversation` field is a contact string and `note` is context. Neither is treated as an email message or a chat history. `access` and `status` are displayed as returned; neither proves membership or send-as authorization.

## Draft and messaging limits

`sharedMailboxDraftsSlice` stores unsent text by mailbox + record ID. It survives tab navigation, but clears on reload or session reset. No browser persistence is used. `ReplyComposer` allows preparing/discarding text but keeps Send disabled because no shared reply API is documented. There is no fake send success, invented thread, fallback to personal-mail sending, or simulated conversation activity.

Components live in `src/components/sharedMailbox`; the dedicated route and scoped styles live in `src/pages/companyMail`. The route is lazy-loaded. Its API, thunk, and slice are in `src/api/sharedMailboxes.js`, `src/redux/thunks/sharedMailboxThunks.js`, and `src/redux/slice/sharedMailboxSlice.js`.

## Required backend contract for real conversation/chat behavior

Provide actual mailbox and thread IDs; a mailbox-scoped, paginated conversation list; paginated thread messages with sender, recipients, body, timestamp and attachments; permitted actions/read/reply/send-as capabilities; a reply POST with server-assigned message ID and idempotency; and event updates or a polling cursor. If “chat” means internal team discussion, provide a separate internal-comment endpoint with author visibility rules; it must never be sent to external recipients accidentally.

Suggested shapes (proposals, not called by this frontend):
- `GET /api/shared-mailboxes/:mailboxId/conversations`
- `GET /api/shared-mailboxes/:mailboxId/conversations/:threadId/messages`
- `POST /api/shared-mailboxes/:mailboxId/conversations/:threadId/replies`
- `POST /api/shared-mailboxes/:mailboxId/conversations/:threadId/comments` for internal discussion, if required

The current reference describes in-memory server example records. Production persistence, authorization, delivery and threading need backend implementation/confirmation. The UI redesign alone does not make these server workflows production-ready.
