import { accountId } from "../utils/access";
export const DEMO_CREDENTIALS = {
  email: "alex.morgan@studio.co",
  password: "Demo@1234",
};
// All active directory accounts use this shared DEMO password. No real credentials.
export const authService = {
  async login({ email, password, users }) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const user = users.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.status === "Active",
    );
    if (!user || password !== DEMO_CREDENTIALS.password)
      throw new Error(
        "The email or password is incorrect, or the account is inactive. Use an active demo directory account.",
      );
    return {
      userId: accountId(user),
      email: user.email,
      signedInAt: new Date().toISOString(),
    };
  },
};
