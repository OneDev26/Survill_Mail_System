# Restored admin console

Update, 4 November 2026: Groups and Email Monitoring now use backend APIs. Their sample behavior below is historical; see [current integration](ADMIN_API_INTEGRATION.md).

The original console was recovered from the parent of Git commit `fda377d` (the API integration). `src/pages/AdminConsole.jsx` is now mounted at `/admin/:section`, restoring the header, icon navigation, tables, stores and audit layout.

Users, Aliases, Known domains, Inbound log and Zoho sync retain their connected backend operations through the embedded `AdminPage.jsx`. Its former standalone heading/navigation is hidden inside the restored console.

The other sections are explicitly marked previews. Their state is isolated in `adminPreviewSlice.js`, resets on logout/reload, and does not change backend records, authentication or mail. Overview/report counts refer to sample data, not organization telemetry. Preview audit events are not durable server audit events.

Email Monitoring includes 21 synthetic emails across three example.com mailboxes, search, mailbox/folder/date filters, advanced filters, pagination, read-only details, sample attachment downloads and CSV export. Data is in `src/data/monitoringSample.js`; it is never merged with the user's real mailbox.

When the backend is ready, add named methods to `src/api/backend.js` and domain thunks for `GET /api/admin/messages`, `GET /api/admin/messages/:id` and authorized attachment links. Replace the sample selector with confirmed Redux results, move filtering/pagination to the server, and use server-authorized audit events for reads/downloads. Preserve the admin route guard and enforce admin permissions at every backend endpoint. Do not use owner-only mailbox APIs to simulate organization-wide access.
