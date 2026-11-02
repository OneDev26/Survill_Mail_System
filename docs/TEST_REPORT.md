# Verification report

Date: 31 October 2026. Scope: backend integration, Redux Toolkit thunk refactor, removal of local-only execution paths, and cleanup.

## Completed checks

| Check                                            | Result                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Backend source routes vs supplied HTML reference | 69 registered and 69 documented; no unmatched method/path combinations                                                                 |
| Production build                                 | Passed                                                                                                                                 |
| ESLint                                           | Passed; includes a rule forbidding direct HTTP-layer imports in components/pages                                                       |
| Prettier check                                   | Passed                                                                                                                                 |
| Playwright API/thunk suite                       | **17 passed**, exit code 0; no runtime or Redux serialization errors detected                                                          |
| Real-backend smoke script syntax                 | Passed (`node --check scripts/smoke-api.mjs`)                                                                                          |
| Local frontend after restart                     | `http://localhost:5173` returned HTTP 200                                                                                              |
| Source cleanup audit                             | No seeded accounts/mailboxes, local persistence adapters, mode switch, duplicate Live components, or direct API calls in UI components |

The 17 tests cover session restoration/logout, request authentication, server search/pagination, message details and bulk undo, failure retention, multipart draft attachments, send failure recovery, workspace CRUD, settings/profile payloads, admin availability, simultaneous 401 refresh, expired sessions, all 68 JSON/multipart adapter routes, task/calendar conversions, thunk pending/fulfilled/rejected state, private-state clearing after logout, and delayed-list protection after confirmed writes.

Tests run in fresh Edge browser contexts against an isolated Vite server on port 4174. API responses are intercepted by Playwright. Fixtures are kept under `tests/` and are not part of the application bundle. The signed-file route is consumed through backend-returned URLs; its actual binary-serving implementation was not exercised.

The Windows runner completed all cases successfully but its automatic dev-server shutdown was blocked by process-control restrictions in this environment. Stopping only the test-created Vite process allowed normal teardown and exit code 0. The user's frontend on port 5173 was restarted separately after Windows held a deleted unused asset directory open.

## Not verified against a running backend

The latest `http://localhost:4000/health` probe failed to connect. The earlier `https://mailapi.survill.com/health` probe failed DNS resolution from this machine. Starting the frontend does not start the API or PostgreSQL.

Consequently, these results do not establish real PostgreSQL persistence, Express authorization, cross-origin cookie/CORS behavior, external mail delivery, SES/ZeptoMail/Zoho credentials, or storage-provider downloads. No real mail was sent. The backend's own database test suite and the real-service smoke script were not run without a reachable test service/account.

## Next real-service verification

1. Start the backend/database, apply migrations, and provision a dedicated test account.
2. Set shell variables `API_URL`, `TEST_EMAIL`, and `TEST_PASSWORD`; run `npm run test:backend`.
3. On a dedicated test account, add `-- --write` to verify temporary resource CRUD and cleanup. This never sends mail.
4. Use two test mailboxes to verify browser login/reload/logout, actual send/receive, attachments, workspace persistence, and member/admin boundaries. Verify deployment CORS and cookies on the actual frontend/API hosts.

See [API_INTEGRATION.md](API_INTEGRATION.md) for setup and known UI limits, [ARCHITECTURE.md](ARCHITECTURE.md) for code organization, and [ENDPOINT_GAPS.md](ENDPOINT_GAPS.md) for missing backend functionality.
