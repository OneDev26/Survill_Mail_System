import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  requestPasswordReset,
  resetPassword,
} from "../redux/thunks/authThunks";
export default function RecoveryForm({ email: initialEmail }) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (!sent) {
        const result = await dispatch(requestPasswordReset(email)).unwrap();
        setSent(true);
        setMessage(result.message);
      } else {
        await dispatch(
          resetPassword({ email, code, newPassword: password }),
        ).unwrap();
        setMessage("Password reset. Sign in with your new password.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="space-y-4 p-6" onSubmit={submit}>
      <label className="block">
        Account email
        <input
          className="field"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {sent && (
        <>
          <label className="block">
            Six-digit code
            <input
              className="field"
              required
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label className="block">
            New password
            <input
              className="field"
              required
              type="password"
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p className="text-xs">
            Use at least 10 characters, including a letter and a number.
          </p>
        </>
      )}
      {message && <p role="status">{message}</p>}
      <button className="btn-primary" disabled={busy}>
        {sent ? "Reset password" : "Send reset code"}
      </button>
    </form>
  );
}
