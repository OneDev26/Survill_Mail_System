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
    <div className="flex-1 overflow-auto p-8">
      <h1 className="mb-6 text-2xl font-semibold">My profile</h1>
      <fieldset disabled={busy} className="max-w-xl space-y-6">
        <form
          className="card space-y-4"
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
          <p>{profile.email}</p>
          {profile.avatar && (
            <img
              src={profile.avatar}
              alt="Your profile"
              className="size-20 rounded-full"
            />
          )}
          <label className="block">
            Display name
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
            <p className="text-xs">
              Contact an administrator to change your display name.
            </p>
          )}
          <label className="block">
            Recovery email
            <input
              className="field"
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
            />
          </label>
          <button className="btn-primary">Save profile</button>
          <label className="block">
            Upload avatar
            <input
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
        </form>
        <form
          className="card space-y-4"
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
            Current password
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
            New password
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
          <p className="text-xs">
            At least 10 characters, including a letter and a number.
          </p>
          <button className="btn-primary">Change password</button>
        </form>
        <button
          className="btn-secondary"
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
  );
}
