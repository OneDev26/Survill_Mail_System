# Async workflows

Every UI-triggered API operation is dispatched through Redux Toolkit `createAsyncThunk`. Endpoint paths and Axios calls belong in `src/api`, not components or reducers.

`companyMailThunks.js` handles the company directory. `scheduledEmailThunks.js` handles scheduled emails; `snoozedEmailThunks.js` handles snoozed records; `sharedMailboxThunks.js` handles shared conversation records and settings; `approvalThunks.js` handles approval requests and admin decisions. Separate collection slices hold server data. See [company mail features](../../../docs/COMPANY_MAIL_FEATURES.md) for contracts and service limitations. All Mail reuses the live mail thunks.

| Module               | Responsibility                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| `authThunks.js`      | Login, cookie restoration, logout, password recovery/change                     |
| `mailThunks.js`      | Mail queries, organization, bulk actions, drafts, uploads, sending, suggestions |
| `workspaceThunks.js` | Contact/task/note/event lists and CRUD                                          |
| `profileThunks.js`   | Profile fields, profile HTML signature and avatar                              |
| `settingsThunks.js`  | Load preferences (GET), save partial preferences (PATCH), replace preferences (PUT) |
| `adminThunks.js`     | Overview, users, aliases, domains, groups, routing, stores, reports, policies, monitoring and contact sync                         |
| `createApiThunk.js`  | Serializable errors and rejecting responses from a previous session             |

## Component pattern

```js
try {
  const result = await dispatch(
    saveWorkspaceItem({ collection: "notes", item: form }),
  ).unwrap();
  // Close the editor only after the server confirms the operation.
  onSaved(result.item);
} catch (error) {
  setError(error.message);
}
```

Redux Toolkit resolves the dispatch promise to an action even on failure. Use `.unwrap()` when a component must stop on failure. Avoid checking the dispatch result against `false`, and do not manually dispatch a second success action.

Slices handle `pending`, `fulfilled` and `rejected`. `trackRequests` records independent status/error/request IDs under each slice's `requests`. Data reducers only commit confirmed payloads. Workspace list request IDs prevent an old response from replacing a newer save.

`createApiThunk` converts errors into `{message,status,details}` and rejects stale responses after the root session generation changes. It does not put Axios responses, passwords, tokens or file bytes into Redux state. File/credential inputs can be thunk arguments; DevTools redacts sensitive action arguments and is disabled in production.

Message-list effects abort their dispatch promises on cleanup. The thunk's AbortSignal reaches Axios. Draft autosave remains serialized inside the editor so upload, save and send cannot overtake each other.

For another endpoint: add an API adapter, define a named domain thunk, update the slice if the response is shared state, dispatch it from the UI, and cover success and failure with a test. See [architecture](../../../docs/ARCHITECTURE.md).
