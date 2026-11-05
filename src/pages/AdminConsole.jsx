import { useSelector } from "react-redux";
import { Link, NavLink, useParams } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Globe,
  UsersRound,
  AtSign,
  Route,
  LockKeyhole,
  Inbox,
  ChartNoAxesCombined,
  ScrollText,
  LayoutDashboard,
  RefreshCw,
  Store,
} from "lucide-react";
import ConnectedAdmin from "./AdminPage";
import AdminGroups from "./AdminGroups";
import EmailMonitoring from "./EmailMonitoring";
import AdminResourcePage from "./AdminResourcePage";
import AdminDashboard from "./AdminDashboard";
import AdminSecurity from "./AdminSecurity";
import AdminInboundLog from "./AdminInboundLog";
import AdminAuditLog from "./AdminAuditLog";
import { sessionUser } from "../utils/access";
import "./AdminPage.css";

const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["monitoring", "Email monitoring", Inbox],
  ["users", "Users", Users],
  ["domains", "Domains", Globe],
  ["groups", "Groups", UsersRound],
  ["aliases", "Aliases", AtSign],
  ["routing", "Mail routing", Route],
  ["security", "Security & retention", LockKeyhole],
  ["stores", "Stores", Store],
  ["reports", "Reports", ChartNoAxesCombined],
  ["audit", "Audit log", ScrollText],
  ["inbound-log", "Inbound log", Inbox],
  ["zoho-sync", "Zoho sync", RefreshCw],
];

export default function AdminConsole() {
  const { section = "overview" } = useParams();
  const user = useSelector(sessionUser);
  let content;
  if (section === "inbound-log") content = <AdminInboundLog />;
  else if (["users", "zoho-sync"].includes(section))
    content = <ConnectedAdmin section={section} embedded />;
  else if (["domains", "aliases", "routing", "stores"].includes(section))
    content = <AdminResourcePage key={section} section={section} />;
  else if (section === "overview") content = <AdminDashboard key={section} />;
  else if (section === "reports")
    content = <AdminDashboard key={section} reports />;
  else if (section === "groups") content = <AdminGroups />;
  else if (section === "monitoring") content = <EmailMonitoring />;
  else if (section === "security") content = <AdminSecurity />;
  else if (section === "audit") content = <AdminAuditLog />;
  else
    content = (
      <div className="admin-empty">
        Admin section not found.{" "}
        <Link to="/admin/overview">Return to overview</Link>
      </div>
    );
  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-brand-icon">
          <ShieldCheck size={24} />
        </div>
        <div>
          <div className="admin-eyebrow">SURVILL / ADMINISTRATION</div>
          <h1>Admin console</h1>
        </div>
        <span className="admin-owner">{user?.role} / Admin</span>
      </header>
      <nav className="admin-nav" aria-label="Administration">
        {navigation.map(([key, label, Icon]) => (
          <NavLink
            key={key}
            to={`/admin/${key}`}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-content">{content}</div>
    </div>
  );
}
