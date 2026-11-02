# Survill Mail

React 19, Redux Toolkit and Vite frontend for the Survill Mail backend. All application data comes from the API. There are no bundled accounts, seeded mailboxes, browser-storage persistence adapters or simulated delivery.

## Run locally

1. Start the backend and its PostgreSQL database, apply its migrations and provision a test user.
2. Copy `.env.example` to `.env`. Set `VITE_API_BASE_URL` to the API origin, without `/api` (default `https://mail-system.ngrok.app`).
3. Configure backend CORS for the exact frontend origin, normally `http://localhost:5173`.
4. Run `npm install`, then `npm run dev`. Sign in with a backend account.

Restart Vite after changing environment variables. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. The frontend cannot start the backend or create an account by itself. Never put passwords, provider keys or other secrets in `VITE_*` variables.

## Code structure

```text
src/
  api/                  HTTP client, endpoint adapters, response/form mappings
  redux/
    thunks/             Async workflows grouped by domain
    slice/              Data and pending/fulfilled/rejected request state
    store.js            Store configuration and DevTools redaction
    rootReducer.js      Account-state reset on logout/session expiry
    requestState.js     Shared request lifecycle tracking
  pages/                Routed screens
  components/           Shared navigation, editors, dialogs and mail UI
  utils/                Small display, access and error helpers
tests/api.spec.mjs       Browser workflow and thunk integration tests
scripts/smoke-api.mjs    Optional real-backend smoke test
docs/                   Architecture, API setup, endpoint gaps and test report
```

Components dispatch domain thunks and use `.unwrap()` to handle success/failure. They do not import the HTTP client or endpoint service; ESLint enforces this boundary. Thunks call API adapters, and reducers commit confirmed data. Tokens stay in memory, and the HttpOnly cookie restores sessions.

See [architecture](docs/ARCHITECTURE.md) and [thunk guide](src/redux/thunks/README.md) before adding a workflow.

## Validation

```sh
npm run lint
npm run format:check
npm run build
npm test
```

The Playwright suite uses installed Microsoft Edge on Windows; elsewhere install Chromium with `npx playwright install chromium`. Set `PW_BROWSER_CHANNEL` to use another Chromium browser. Tests start a separate server on port 4174, intercept API traffic and use fresh browser contexts. Test fixtures live only in tests and are not shipped with the app. `npm run test:api` is an alias for the same suite.

For a reachable real backend, set `API_URL`, `TEST_EMAIL` and `TEST_PASSWORD`, then run `npm run test:backend`. Add `-- --write` only with a dedicated test account to exercise temporary resource CRUD and cleanup. This script never sends mail.

## API coverage and remaining work

The supplied reference matches all **69 registered backend routes**. The adapter covers 68 JSON/multipart routes; signed file URLs are consumed directly. Supported screens cover authentication/recovery, mail/drafts/attachments, personal workspace records, profile/settings, users/aliases, known domains, inbound logs and contact sync.

Features without backend support are unavailable rather than simulated. [Additional endpoint requirements](docs/ENDPOINT_GAPS.md) describes missing stores, organization-wide monitoring, groups, hosted domains, routing, policies and reporting, plus existing-contract issues. [API integration](docs/API_INTEGRATION.md) records behavior and UI limitations. [Test report](docs/TEST_REPORT.md) distinguishes mocked frontend coverage from real deployment verification.
