import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Camera, Mail, MapPin, ShieldCheck } from "lucide-react";
import { profileUpdated } from "../redux/slice/profileSlice";
import { notify } from "../redux/slice/uiSlice";
import { initials } from "../utils/mail";

export default function ProfilePage() {
  const profile = useSelector((state) => state.profile);
  const [form, setForm] = useState(profile);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const dispatch = useDispatch();
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 200 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image smaller than 200 KB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = src;
      });
      setForm((previous) => ({ ...previous, avatar: src }));
    } catch {
      setError("This image could not be opened. Please choose another file.");
    } finally {
      setBusy(false);
    }
  }
  function save(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    dispatch(profileUpdated({ ...form, name: form.name.trim() }));
    setForm({ ...form, name: form.name.trim() });
    setError("");
    dispatch(notify({ text: "Your profile has been updated." }));
  }
  return (
    <div className="thin-scrollbar flex-1 overflow-y-auto p-5 sm:p-8">
      <div className="w-full">
        <p className="text-xs font-medium uppercase tracking-widest text-brand-600">
          YOUR ACCOUNT
        </p>
        <h1 className="mt-2 text-2xl font-semibold">My profile</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500">
          A little about you, for the people you work with.
        </p>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="card h-fit text-center">
            <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-3xl font-semibold text-brand-600">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Your profile"
                  className="size-full object-cover"
                />
              ) : (
                initials(profile.name)
              )}
            </div>
            <h2 className="mt-4 break-words text-lg font-semibold">
              {profile.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{profile.title}</p>
            <div className="my-6 border-t border-slate-100" />
            <p className="flex items-center justify-center gap-2 break-all text-xs text-slate-500">
              <Mail size={14} />
              {profile.email}
            </p>
            <p className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
              <MapPin size={14} />
              {profile.location || "Location not added"}
            </p>
            <p className="mt-7 rounded-lg bg-emerald-50 py-2 text-xs text-emerald-700">
              Demo account · Active
            </p>
          </aside>
          <form onSubmit={save} className="card">
            <h2 className="mb-6 font-semibold">Personal information</h2>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-xl text-brand-600">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="New profile preview"
                    className="size-full object-cover"
                  />
                ) : (
                  initials(form.name)
                )}
              </div>
              <div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => input.current.click()}
                  className="btn-secondary py-2 text-xs"
                >
                  <Camera size={14} />
                  Change photo
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    className="ml-3 text-xs text-red-600"
                    onClick={() => setForm({ ...form, avatar: "" })}
                  >
                    Remove
                  </button>
                )}
                <p className="mt-2 text-[11px] text-slate-400">
                  JPG, PNG or WebP. Up to 200 KB.
                </p>
              </div>
              <input
                ref={input}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={upload}
                className="hidden"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["name", "Full name"],
                ["title", "Job title"],
                ["company", "Company"],
                ["phone", "Phone number"],
                ["location", "Location"],
              ].map(([key, label]) => (
                <label key={key}>
                  <span className="field-label">{label}</span>
                  <input
                    className="field"
                    name={key}
                    type={key === "phone" ? "tel" : "text"}
                    required={key === "name"}
                    maxLength={100}
                    value={form[key]}
                    onChange={update}
                  />
                </label>
              ))}
              <label>
                <span className="field-label">Account email</span>
                <input
                  className="field bg-slate-50 text-slate-400"
                  value={profile.email}
                  readOnly
                />
                <span className="mt-1 block text-[10px] text-slate-400">
                  Fixed for this demo account
                </span>
              </label>
              <label className="sm:col-span-2">
                <span className="field-label">About you</span>
                <textarea
                  className="field min-h-24"
                  name="bio"
                  maxLength={500}
                  value={form.bio}
                  onChange={update}
                />
                <span className="float-right text-[10px] text-slate-400">
                  {form.bio.length}/500
                </span>
              </label>
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={!dirty || busy}
                onClick={() => {
                  setForm(profile);
                  setError("");
                }}
                className="btn-secondary"
              >
                Cancel changes
              </button>
              <button disabled={!dirty || busy} className="btn-primary">
                {busy ? "Reading image…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-500">
          <ShieldCheck className="shrink-0 text-brand-600" size={20} />
          <p>
            Profile changes are stored locally. Your avatar and name appear
            throughout this workspace. Account verification and password
            management require a connected authentication service.
          </p>
        </div>
      </div>
    </div>
  );
}
