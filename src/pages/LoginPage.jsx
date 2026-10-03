import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { authService, DEMO_CREDENTIALS } from "../api/authService";
import { signedIn } from "../redux/slice/authSlice";
import Dialog from "../components/Dialog";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const session = useSelector((state) => state.auth.session);
  const users = useSelector((state) => state.admin.users);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  if (session) return <Navigate to="/mail/Inbox" replace />;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await authService.login({ email, password, users });
      dispatch(signedIn({ session: result, remember }));
      navigate("/mail/Inbox", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#f2effc] p-14 lg:flex xl:p-20">
        <div className="flex items-center gap-3 text-2xl font-semibold">
          <span className="rounded-xl bg-brand-600 p-2.5 text-white">
            <Mail size={25} />
          </span>
          zoho <span className="font-normal text-slate-500">mail</span>
        </div>
        <div className="relative z-10 max-w-lg">
          <span className="rounded-full border border-brand-500/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-brand-600">
            YOUR SPACE TO DO GREAT WORK
          </span>
          <h1 className="mt-8 text-5xl font-semibold leading-[1.15] tracking-tight text-slate-800">
            A clearer inbox.
            <br />
            <span className="text-brand-600">A calmer workday.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-slate-500">
            Keep conversations, ideas, and your team together in one
            thoughtfully organized workspace.
          </p>
          <div className="mt-10 rotate-[-2deg] rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-violet-200/40">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">
                SC
              </span>
              <div>
                <p className="text-sm font-semibold">Sophia Chen</p>
                <p className="mt-1 text-xs text-slate-400">
                  A little progress, every day.
                </p>
              </div>
              <span className="ml-auto size-2 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-5 text-sm font-medium">
              Website redesign — ready for your review
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              The latest designs are ready. Let’s make something great together.
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs text-slate-400">
          Mail, with room to think.
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2 text-xl font-semibold lg:hidden">
            <Mail className="text-brand-600" />
            zoho mail
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mb-8 mt-3 text-sm text-slate-500">
            Sign in to your demo workspace.
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
                  placeholder="Enter your password"
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
                className="text-brand-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-600"
              >
                {error}
              </p>
            )}
            <button disabled={busy} className="btn-primary w-full py-3">
              {busy ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <div className="mt-7 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
            <p className="text-xs font-semibold text-brand-600">
              Try the admin demo account
            </p>
            <p className="mt-2 text-xs text-slate-600">
              {DEMO_CREDENTIALS.email}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Password: {DEMO_CREDENTIALS.password}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEmail(DEMO_CREDENTIALS.email);
                setPassword(DEMO_CREDENTIALS.password);
                setError("");
              }}
              className="mt-3 text-xs font-semibold text-brand-600 hover:underline"
            >
              Fill demo credentials →
            </button>
          </div>
          <div className="mt-3 rounded-xl border border-slate-200 p-4 text-xs text-slate-600">
            <p>Member account: sophia@studio.co</p>
            <p className="mt-1">Password: {DEMO_CREDENTIALS.password}</p>
            <button
              type="button"
              disabled={busy}
              className="mt-3 font-semibold text-brand-600"
              onClick={() => {
                setEmail("sophia@studio.co");
                setPassword(DEMO_CREDENTIALS.password);
                setError("");
              }}
            >
              Fill member credentials
            </button>
            <p className="mt-3 leading-5">
              All active directory users share this demo password. Access
              follows the role assigned by an administrator. Organization
              administrators can review locally stored mail.
            </p>
          </div>
          <p className="mt-6 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            Local demo only. No real account is authenticated and no email is
            delivered.
          </p>
        </div>
      </section>
      {help && (
        <Dialog title="Demo account access" onClose={() => setHelp(false)}>
          <div className="space-y-4 p-6 text-sm leading-6 text-slate-600">
            <p>
              This demo uses directory accounts with a shared sample password.
              Password recovery will be available when you connect your
              authentication API.
            </p>
            <p>
              Use <strong>{DEMO_CREDENTIALS.email}</strong> with password{" "}
              <strong>{DEMO_CREDENTIALS.password}</strong>.
            </p>
            <button
              className="btn-primary"
              onClick={() => {
                setEmail(DEMO_CREDENTIALS.email);
                setPassword(DEMO_CREDENTIALS.password);
                setHelp(false);
              }}
            >
              Use demo account
            </button>
          </div>
        </Dialog>
      )}
    </main>
  );
}
