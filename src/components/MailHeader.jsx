import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Menu,
  X,
  CircleHelp,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  ScanEye,
} from "lucide-react";
import { Avatar, IconButton } from "./Ui";
import { initials } from "../utils/mail";
import { canAdminister, sessionUser } from "../utils/access";
import { signedOut } from "../redux/slice/authSlice";
export default function MailHeader({ query, onSearch, onMenu, onHelp, title }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.profile);
  const isAdmin = useSelector(canAdminister);
  const user = useSelector(sessionUser);
  useEffect(() => {
    if (!menu) return;
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setMenu(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [menu]);
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white px-4 lg:px-7">
      <IconButton
        icon={Menu}
        label="Open navigation"
        className="md:hidden"
        onClick={onMenu}
      />
      <span className="mr-5 hidden text-sm font-semibold capitalize text-brand-600 lg:block">
        {title}
      </span>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query);
        }}
        className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-lg bg-[#f5f6f9] px-3.5"
      >
        <Search size={17} className="shrink-0 text-slate-400" />
        <input
          aria-label="Search mail"
          value={query}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search mail in this folder"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
        />
        {query && (
          <IconButton
            icon={X}
            label="Clear search"
            onClick={() => onSearch("")}
          />
        )}
      </form>
      <div className="ml-auto flex items-center gap-2">
        {isAdmin && (
          <Link
            to="/admin/overview"
            aria-label="Admin tools"
            title="Admin tools"
            className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-brand-600"
          >
            <ShieldCheck size={18} />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
        <IconButton
          icon={CircleHelp}
          label="Help"
          onClick={onHelp}
          className="hidden sm:flex"
        />
        <Link
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className="hidden p-2 text-slate-500 sm:block"
        >
          <Settings size={18} />
        </Link>
        <div ref={ref} className="relative">
          <button
            aria-label="Account menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
            className="rounded-full"
          >
            <Avatar
              initials={initials(profile.name)}
              src={profile.avatar}
              small
            />
          </button>
          {menu && (
            <div className="absolute right-0 top-12 z-30 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-3">
                <p className="truncate font-semibold">{profile.name}</p>
                <p className="mt-1 truncate text-xs text-slate-400">
                  {profile.email}
                </p>
              </div>
              {isAdmin && (
                <>
                  <p className="px-3 pt-2 text-xs text-brand-600">
                    {user.role}
                  </p>
                  <Link
                    to="/admin/overview"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-50"
                  >
                    <ShieldCheck size={16} />
                    Admin tools
                  </Link>
                  <Link
                    to="/admin/monitoring"
                    onClick={() => setMenu(false)}
                    className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-50"
                  >
                    <ScanEye size={16} />
                    Email monitoring
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                onClick={() => setMenu(false)}
                className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-50"
              >
                <User size={16} />
                My profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMenu(false)}
                className="flex items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-50"
              >
                <Settings size={16} />
                Settings
              </Link>
              <button
                className="flex w-full items-center gap-2 rounded-lg p-3 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  dispatch(signedOut());
                  navigate("/login", { replace: true });
                }}
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
