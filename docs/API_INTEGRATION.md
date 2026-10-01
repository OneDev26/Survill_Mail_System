# API integration

This is a single-account local demo. Redux owns domain data; browser storage is the persistence adapter. Demo login is a navigation gate, not a production security boundary. No mail server is contacted.

## State ownership

| Slice | Owns | Persistence |
| --- | --- | --- |
| auth | Session and remember-me selection | localStorage or sessionStorage |
| profile | Name, avatar, job, company, phone, location, bio | localStorage |
| mail | Messages, folders, labels, one reversible operation | localStorage; undo excluded |
| settings | Density, page size, read behavior, signature, confirmations | localStorage |
| workspace | Contacts, tasks, notes, events | localStorage |
| ui | Compose descriptor, notifications, storage warning | Memory |

Store hydration and persistence live in src/redux/store.js. Domain reducers live in src/redux/slice. Storage access is isolated in src/api/storage.js. Valid v1 demo mail is imported on first v2 use. Native File objects never enter Redux; attachment metadata and data URLs are serializable.

## Connecting a backend

1. Configure VITE_API_BASE_URL. Implement domain adapters using src/api/client.js. Keep endpoint paths out of components.
2. Replace authService.login, remove the demo credentials, and validate sessions with your backend before rendering protected pages. Implement real logout and password recovery using the backend's authentication policy.
3. Add createAsyncThunk modules under src/redux/thunks. Add request status and error fields with pending/fulfilled/rejected reducers. Keep draft form fields separate from request status.
4. Replace synchronous UI mutation dispatches with thunks. Commit success responses to slices; retain form input and show actionable feedback on failure. Use rollback for optimistic operations.
5. Move pagination/search to server queries when necessary. Debounce search, cancel obsolete requests, and guard against stale responses.
6. Upload attachments separately and retain server IDs/download URLs. Replace demo data URLs and the local 1 MB limit. Make draft autosave debounced and concurrency-safe.
7. Scope cached state by authenticated account and clear it appropriately on real logout/account switching. Add session-expiry and cross-tab handling.
8. Implement Undo using compensating server mutations. Use idempotency keys for sending and retry only safe operations. Keep destructive confirmations.

## Models

- Message: id, sender, email, to, cc, bcc, subject, body, preview, folder, label, unread, starred, initials, color, date (ISO), time (display), attachments[]. Recipient strings are comma-separated; convert them to arrays in adapters. Fields such as cc/bcc may be absent on old demo data.
- Attachment: name, size (display), bytes, dataUrl OR content. Replace binary data with server attachment IDs and authorized download URLs. Never reveal Bcc on received messages.
- Contact: id, name, email, phone, company.
- Task: id, title, done, due (YYYY-MM-DD or empty).
- Note: id, title, body.
- Event: id, title, date (YYYY-MM-DD), time/endTime (HH:mm local same-day time), location, description. Add timezone/recurrence support according to your backend.
- Label: name, dot/badge Tailwind classes. Use stable IDs and color tokens in production, mapping colors to classes in the UI. Custom folders also need stable server IDs.

## Suggested operations

| Domain | Operations to implement |
| --- | --- |
| Auth | login, getSession, logout, requestPasswordReset |
| Mail | list, get, saveDraft, send, updateFlags, move, delete, restore |
| Attachments | upload, download, remove |
| Folders/labels | list, create, update, delete |
| Profile/settings | get, update |
| Workspace | list/create/update/delete contacts, tasks, notes, events |

These are proposed contracts, not implemented endpoints. Retain the Playwright workflow tests as adapters change and add network failure/loading and API integration coverage.
