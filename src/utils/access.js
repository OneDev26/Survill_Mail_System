// UI visibility only; authorization is always enforced by the backend.
export const sessionUser = (state) => state.auth.session;
export const canAdminister = (state) => state.auth.session?.role === "admin";
