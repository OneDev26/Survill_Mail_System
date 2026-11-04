import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  uploadAvatar,
  removeAvatar,
} from "../redux/thunks/profileThunks";
import { changePassword, logout } from "../redux/thunks/authThunks";
import { notify } from "../redux/slice/uiSlice";

export default function ProfilePage() {
  const profile = useSelector((state) => state.profile);
  const isAdmin = useSelector((state) => state.auth.session.role === "admin");
  const dispatch = useDispatch();
  const [name, setName] = useState(profile.name);
  const [recoveryEmail, setRecoveryEmail] = useState(profile.recoveryEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action, text = "Account updated.") {
    setBusy(true);
    setError("");
    try {
      await dispatch(action).unwrap();
      if (text) dispatch(notify({ text }));
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="w-full min-w-0">
        <h1 className="mb-6 text-2xl font-semibold">My profile</h1>
        <fieldset
          disabled={busy}
          className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2"
        >
          <form
            className="card min-w-0 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              run(
                updateProfile({
                  ...(isAdmin ? { displayName: name } : {}),
                  recoveryEmail: recoveryEmail || null,
                }),
              );
            }}
          >
            <div className="space-y-2">
              <h2 className="font-semibold">Profile details</h2>
              <p className="break-all text-sm text-slate-500">
                {profile.email}
              </p>
            </div>
            {profile.avatar && (
              <img
                src={profile.avatar}
                alt="Your profile"
                className="size-20 rounded-full object-cover"
              />
            )}
            <label className="block">
              <span className="field-label">Display name</span>
              <input
                className="field"
                required
                maxLength={120}
                value={name}
                disabled={!isAdmin}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {!isAdmin && (
              <p className="text-xs leading-relaxed text-slate-500">
                Contact an administrator to change your display name.
              </p>
            )}
            <label className="block">
              <span className="field-label">Recovery email</span>
              <input
                className="field"
                type="email"
                value={recoveryEmail}
                onChange={(event) => setRecoveryEmail(event.target.value)}
              />
            </label>
            <button className="btn-primary">Save profile</button>
            <div className="space-y-4 border-t border-slate-200 pt-5">
              <label className="block min-w-0">
                <span className="field-label">Upload avatar</span>
                <input
                  className="block w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 focus-visible:outline-2 focus-visible:outline-brand-500"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    const file = event.target.files[0];
                    event.target.value = "";
                    if (file) run(uploadAvatar(file));
                  }}
                />
              </label>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => run(removeAvatar())}
              >
                Remove avatar
              </button>
            </div>
          </form>
          <form
            className="card min-w-0 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              if (await run(changePassword({ currentPassword, newPassword }))) {
                setCurrentPassword("");
                setNewPassword("");
              }
            }}
          >
            <h2 className="font-semibold">Change password</h2>
            <label className="block">
              <span className="field-label">Current password</span>
              <input
                className="field"
                required
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="field-label">New password</span>
              <input
                className="field"
                required
                type="password"
                minLength={10}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <p className="text-xs leading-relaxed text-slate-500">
              At least 10 characters, including a letter and a number.
            </p>
            <button className="btn-primary">Change password</button>
          </form>
          <button
            className="btn-secondary justify-self-start lg:col-span-2"
            onClick={() => run(logout(true), null)}
          >
            Sign out all devices
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="mt-4 text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
