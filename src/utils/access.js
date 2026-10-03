// Demo role checks. Production authorization must be enforced by the server.
export const accountId = (user) =>
  user.id === "owner" ? "alex-morgan" : user.id;
export function sessionUser(state) {
  const session = state.auth.session;
  return (
    session &&
    state.admin.users.find(
      (user) =>
        accountId(user) === session.userId &&
        user.email === session.email &&
        user.status === "Active",
    )
  );
}
export function canAdminister(state) {
  return ["Administrator", "Super administrator"].includes(
    sessionUser(state)?.role,
  );
}
