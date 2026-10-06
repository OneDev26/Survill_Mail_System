# Zoho Mail inspired workspace

Responsive React, Tailwind CSS v4, Redux Toolkit, and React Router app with role-aware local demo accounts and seeded data. Delivery between directory users is simulated in this browser; no real email is sent.

## Start

```sh
npm install
npm run dev
```

Admin login: **alex.morgan@studio.co** / **Demo@1234**. Member login: **sophia@studio.co** / **Demo@1234**. All active directory accounts use this shared demo password; their directory role determines admin access. The login page also has a Fill demo credentials button.

```sh
npm run build
npm run lint
npm test
npm run format:check
```

Browser tests use installed Microsoft Edge on Windows. On other platforms run `npx playwright install chromium` first. Set `PW_BROWSER_CHANNEL` to select another installed Chromium browser. Tests start a separate Vite server on port 4173 and use fresh browser contexts, without changing your personal browser data.

## Features

- Protected routes, demo sign-in validation, password visibility, remember-me sessions, account menu, logout, and demo access help.
- Editable profile and avatar upload/preview/removal, reflected across the workspace.
- Folder/label navigation, search, unread/starred/attachment filters, sort, pagination, bulk selection, read/unread, archive, spam, trash, restore, move, labels, and undo.
- Confirmed permanent deletion and empty trash; configurable trash confirmation.
- Compose, Cc/Bcc, contacts suggestions, reply/reply-all/forward, signatures, debounced draft autosave, manual save/discard, attachments/downloads, Ctrl/Cmd+Enter to send.
- Custom folders/labels and persistent inbox preferences.
- Contacts, tasks, notes, and monthly calendar: create/edit/delete, validation, search, and persistence.
- Mobile navigation, responsive reading pane, accessible native dialogs, focus restoration, notifications, and empty states.

## Structure

```text
src/
  api/          Demo authentication, data, storage, future axios client
  components/   Shared layout, mail components, compose, dialogs, editor
  pages/        Login, mail, profile, settings, workspace pages
  redux/
    slice/      auth, profile, mail, settings, workspace, ui
    thunks/     Guidance for future async API workflows
    store.js    Store configuration, hydration, persistence
  utils/        Pure mail filtering and recipient helpers
tests/          Browser workflow tests
docs/           API integration guide
```

See [docs/API_INTEGRATION.md](docs/API_INTEGRATION.md). Domain state is separated into slices; no network thunks or fabricated HTTP endpoints run in the demo.

## Demo boundaries

Active directory accounts have separate local mailboxes, profiles, settings, and workspace data. Login is client-side simulation; password-recovery help does not send email. Local data remains after logout so the same account can resume. Attachments are limited to 1 MB per message; avatars to 200 KB. Calendar events are local, same-day events without recurrence or invitations. Real delivery, multi-device synchronization, and production authentication/authorization require a backend.

Storage uses `zoho-demo-v2:` keys and imports valid older mailbox data. Storage failure displays a persistent warning and the app continues in memory. Clear this site's browser storage to reset demo data. Serve index.html for unknown application paths in production so direct routes like /profile work.

## Admin console

Administrators see **Admin** in the top bar and **Admin tools** / **Email monitoring** in the account menu. There is no admin entry in the sidebar. Members cannot open admin routes. Includes users, domains, groups, aliases, routing, sender controls, security/retention configuration, stores and employee email lists, reports, audit history, and organization settings. See [docs/ADMIN_CONSOLE.md](docs/ADMIN_CONSOLE.md) for workflows and production integration requirements. Email monitoring reads all currently stored local mailbox copies, including drafts, with search, mailbox/folder/date filters and audited read-only review. All administration is local demo state; policies are not enforced by a server.


Admin: alex.morgan@studio.co
Member: sophia@studio.co
Password: Demo@1234
