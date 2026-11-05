# Settings integration

The authenticated HTTP client supplies the configured base URL, bearer token, cookies, and session refresh for all requests.

- `src/api/settings.js`: GET, PATCH, and PUT `/api/settings`. Writes send a flat JSON object; responses contain `{ preferences }`.
- `src/redux/thunks/settingsThunks.js`: `fetchSettings()`, `saveSettings(changes)`, and `replaceSettings(preferences)` use the shared async-thunk error and session handling.
- `src/redux/slice/settingsSlice.js`: stores the confirmed preferences, normalized mailbox settings, and request lifecycle. A successful write invalidates older pending reads.
- `src/utils/settings.js`: maps the documented preference keys to the existing mailbox controls. Legacy keys remain readable for existing accounts; new writes use documented keys.
- `src/pages/SettingsPage.jsx`: loads settings before allowing edits, sends only changed fields with PATCH, offers load retry, preserves failed edits, and adopts the server response after saving.

| API preference | Mailbox state |
| --- | --- |
| `compactMessageList` | `compact` |
| `markAsReadWhenOpened` | `markReadOnOpen` |
| `confirmBeforeMovingToTrash` | `confirmTrash` |
| `messagesPerPage` | `pageSize` |
| `useSignature` | `useSignature` |
| `signature` | `signature` (plain text) |

PATCH preserves custom preferences. PUT intentionally replaces the entire preference object and is exposed through `replaceSettings`; the ordinary Save preferences button uses PATCH.

Profile changes remain separate: `updateProfile({ displayName, signatureHtml, recoveryEmail })` in `profileThunks.js` calls PATCH `/api/profile` and updates the profile/session slices from the returned user. Saving preference text does not issue a second profile write.
