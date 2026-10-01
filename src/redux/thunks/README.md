# Future async workflows

No network thunks run in this demo. Add createAsyncThunk modules here when real endpoints are available, organized by domain: auth, mail, profile, workspace.

Call adapters in src/api from thunks, never from reducers. Add pending/fulfilled/rejected handling, request status, and error fields to the relevant slice. Dispatch existing mutation actions only on success, or implement explicit optimistic rollback. Replace synchronous UI dispatches with your thunks at the component boundary.

See docs/API_INTEGRATION.md for models, operations, and migration notes.
