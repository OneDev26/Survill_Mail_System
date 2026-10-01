export const DEMO_CREDENTIALS = {
  email: "alex.morgan@studio.co",
  password: "Demo@1234",
};

// Replace this adapter with your authentication endpoint. Never persist passwords.
export const authService = {
  async login({ email, password }) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (
      email.trim().toLowerCase() !== DEMO_CREDENTIALS.email ||
      password !== DEMO_CREDENTIALS.password
    ) {
      throw new Error(
        "The email or password is incorrect. Use the demo credentials below.",
      );
    }
    return {
      userId: "alex-morgan",
      email: DEMO_CREDENTIALS.email,
      signedInAt: new Date().toISOString(),
    };
  },
};
