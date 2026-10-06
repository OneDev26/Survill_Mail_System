import { Provider, useSelector } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { store } from "./redux/store";
import LoginPage from "./pages/LoginPage";
import MailPage from "./pages/MailPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import WorkspacePage from "./pages/WorkspacePage";
import AppLayout from "./components/AppLayout";
import Notifications from "./components/Notifications";
import AdminPage from "./pages/AdminPage";
import { canAdminister, sessionUser } from "./utils/access";

function ProtectedRoute() {
  const session = useSelector(sessionUser);
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const allowed = useSelector(canAdminister);
  return allowed ? <Outlet /> : <Navigate to="/mail/Inbox" replace />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/mail/Inbox" replace />} />
              <Route path="mail/:folder" element={<MailPage />} />
              <Route element={<AdminRoute />}>
                <Route
                  path="admin/quarantine"
                  element={<Navigate to="/admin/stores" replace />}
                />
                <Route
                  path="admin"
                  element={<Navigate to="/admin/overview" replace />}
                />
                <Route path="admin/:section" element={<AdminPage />} />
              </Route>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              {["contacts", "tasks", "notes", "calendar"].map((page) => (
                <Route
                  key={page}
                  path={page}
                  element={<WorkspacePage key={page} kind={page} />}
                />
              ))}
              <Route
                path="*"
                element={
                  <div className="m-auto p-8 text-center">
                    <h1 className="text-2xl font-semibold">Page not found</h1>
                    <p className="my-4 text-slate-500">
                      This page may have moved.
                    </p>
                    <a href="/mail/Inbox" className="btn-primary">
                      Back to inbox
                    </a>
                  </div>
                }
              />
            </Route>
          </Route>
        </Routes>
        <Notifications />
      </BrowserRouter>
    </Provider>
  );
}
