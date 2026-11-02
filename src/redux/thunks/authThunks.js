import { backend } from "../../api/backend";
import { createApiThunk } from "./createApiThunk";

// Tokens are held by the HTTP client. Redux receives only public user data.
async function sessionData(session) {
  const [folders, labels] = await Promise.all([
    backend.folders(),
    backend.labels(),
  ]);
  return { user: session.user, ...folders, ...labels };
}
export const login = createApiThunk("auth/login", async (credentials) =>
  sessionData(await backend.login(credentials)),
);
export const restoreSession = createApiThunk(
  "auth/restoreSession",
  async () => sessionData(await backend.refresh()),
  {
    condition: (_, { getState }) => getState().auth.status === "idle",
  },
);
export const logout = createApiThunk(
  "auth/logout",
  async (allDevices = false) => {
    await backend.logout(allDevices);
  },
);
export const requestPasswordReset = createApiThunk(
  "auth/requestPasswordReset",
  (email) => backend.forgot(email),
);
export const resetPassword = createApiThunk("auth/resetPassword", (body) =>
  backend.reset(body),
);
export const changePassword = createApiThunk(
  "auth/changePassword",
  async (body) => (await backend.changePassword(body)).user,
);
