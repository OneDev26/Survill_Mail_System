# Survill Mail API integration

Update, 4 November 2026: six admin group/monitoring routes from the supplied reference are now integrated, bringing the local inventory to 75 routes (74 JSON/multipart adapters plus signed files). See [Admin API integration](ADMIN_API_INTEGRATION.md) for current behavior and contract limits. Earlier counts below describe the original integration review.

Reviewed 31 October 2026 against the supplied HTML reference and backend source. All **69 registered method/path combinations** appear in the reference; no missing or stale routes were found in that comparison. Route coverage does not prove deployment health or backend correctness.

## Setup

Copy `.env.example` to `.env`:

```dotenv
VITE_API_BASE_URL=https://mail-backend.ngrok.app
```

Use an origin without `/api`; the hosted backend is `https://mail-backend.ngrok.app`. Restart Vite after environment changes. Start the backend/PostgreSQL separately and provision an account through backend administration. CORS must allow the exact frontend origin. Keep the frontend and API on same-site hosts for the documented SameSite=Lax refresh cookie; localhost and 127.0.0.1 are different hosts.

There is no alternative local-data mode, sample login or public registration flow.

## Implementation map

| Layer                                         | Location                                         |
| --------------------------------------------- | ------------------------------------------------ |
| HTTP, credentials, token rotation             | `src/api/client.js`                              |
| Named adapters for 68 JSON/multipart routes   | `src/api/backend.js`                             |
| DTO/display/form conversion                   | `src/api/models.js`                              |
| Async domain operations                       | `src/redux/thunks/`                              |
| Confirmed data and request lifecycle reducers | `src/redux/slice/`                               |
| Root reset and store                          | `src/redux/rootReducer.js`, `src/redux/store.js` |
| Session bootstrap                             | `src/components/SessionGate.jsx`                 |

The 69th route serves signed files. The frontend follows returned URLs rather than reconstructing tokens or attaching an API bearer token. All UI API operations dispatch async thunks; components do not call Axios/adapters directly. See [architecture](ARCHITECTURE.md).

## Connected workflows

- Authentication: login with remember flag, refresh-cookie restoration, logout, logout-all, forgot/reset/change password. Tokens stay in memory; the HttpOnly cookie restores sessions.
- Mail: server search/filter/pagination, full detail reads with configurable mark-read, archive/spam/trash/restore/move, read/star flags, labels, undo, confirmed permanent deletion and empty Trash/Spam.
- Compose: one server-created draft, serialized autosave, multipart `files` upload, attachment removal, send-enabled aliases, recipient suggestions, reply/forward source IDs, send and discard. Failed sends keep the draft/editor.
- Workspace: contact/task/note/event CRUD. Contacts load all available pages; other collections are capped at 1,000 by the backend. Read-only/company-contact controls reflect permissions. Tasks map `done/due` to `completed/dueDate`; event inputs convert local times to ISO instants and preserve cross-day end dates.
- Profile/settings: permitted display-name updates, recovery email, multipart `avatar` upload/removal, password changes, preferences and escaped text signatures.
- Administration: users, shared aliases, known company domains, inbound processing log, Zoho sync status/run. Unsupported sections report unavailable and contain no local substitutes.

## Contract details and UI limits

Bearer tokens authenticate protected APIs; refresh cookies alone do not. Requests include credentials. Multipart boundaries are browser-generated. DELETE/204 responses have no JSON body. Rate-limit text errors and JSON validation errors are displayed without assuming every failure is JSON.

Sender display uses resolved `displayName`, never untrusted `headerName`. Message HTML is displayed in an empty-sandbox iframe; remote images may load. Attachment clicks obtain fresh signed URLs. Compose is plain text: editing a rich HTML draft replaces its HTML with the edited text.

Bulk undo returns the server payload unchanged. Label operations do not advertise undo because the documented inverse is not a precise snapshot. Multiple label IDs remain intact; the reading pane displays the first label, with add-label and remove-all-label controls. Label UI styling currently uses a common violet style.

Preferences and `signatureHtml` are separate requests; a failure can leave a partial save requiring retry. Known domains resolve identities and are not hosted-domain/DNS provisioning. Inbound logs are not organization-wide mailbox monitoring. Primary email changes and user deletion are not available in the documented user API.

The API adapters also expose health, current-user/profile reads, replace-preferences PUT, folder rename, label rename/color, threads, original .eml links, direct one-shot sending and batch identity lookup. These do not all have dedicated UI controls. The frontend-only backlog in [ENDPOINT_GAPS.md](ENDPOINT_GAPS.md) separates such controls from missing endpoints.

## Verification

`npm test` runs browser interactions against intercepted responses, including all 68 adapter request routes and thunk lifecycle/race tests. It does not execute Express/PostgreSQL, provider delivery, production CORS or storage services. Test fixtures exist only under `tests/`.

For real service checks, set `API_URL`, `TEST_EMAIL`, and `TEST_PASSWORD`, then run `npm run test:backend`. On a dedicated account, `npm run test:backend -- --write` creates/updates/cleans temporary contacts, tasks, notes, events, folders, labels and an unsent draft. It never sends mail, triggers sync, or changes user administration. Failed cleanup prints resource paths. Keep credentials out of Vite variables and source control.

[TEST_REPORT.md](TEST_REPORT.md) records checks actually completed and the remaining environment blocker. [ENDPOINT_GAPS.md](ENDPOINT_GAPS.md) is the proposed backend backlog; proposed routes are not called by this application.
