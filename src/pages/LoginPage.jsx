import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Mail } from "lucide-react";
import { login } from "../redux/thunks/authThunks";
import Dialog from "../components/Dialog";
import RecoveryForm from "../components/RecoveryForm";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector((state) => state.auth.session);
  const busy = useSelector((state) => state.auth.status === "signingIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  if (session) return <Navigate to="/mail/Inbox" replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    try {
      await dispatch(login({ email, password, remember })).unwrap();
      navigate("/mail/Inbox", { replace: true });
    } catch (error) {
      setError(error.message);
    }
  }
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#f2effc] p-14 lg:flex xl:p-20">
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <Mail className="text-brand-600" />
          Survill Mail
        </div>
        <div className="max-w-lg">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            A clearer inbox.
            <br />
            <span className="text-brand-600">A calmer workday.</span>
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-500">
            Keep conversations, ideas, and your team together in one
            thoughtfully organized workspace.
          </p>
        </div>
        <p className="text-xs text-slate-400">Mail, with room to think.</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-semibold">Welcome back</h2>
          <p className="mb-8 mt-3 text-sm text-slate-500">
            Sign in to your mailbox.
          </p>
          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <span className="field-label">Email address</span>
              <input
                autoFocus
                className="field"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <span className="relative block">
                <input
                  className="field pr-12"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                  className="absolute inset-y-0 right-3 text-slate-400"
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={() => setHelp(true)}
                className="text-brand-600"
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-xs text-red-600"
              >
                {error}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full py-3">
              {busy ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Signing in?
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
      {help && (
        <Dialog title="Reset password" onClose={() => setHelp(false)}>
          <RecoveryForm email={email} />
        </Dialog>
      )}
    </main>
  );
}
