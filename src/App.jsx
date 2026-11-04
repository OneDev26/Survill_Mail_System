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
import AdminPage from "./pages/AdminConsole";
import AppLayout from "./components/AppLayout";
import SessionGate from "./components/SessionGate";
import Notifications from "./components/Notifications";
import { canAdminister, sessionUser } from "./utils/access";

function ProtectedRoute() {
  return useSelector(sessionUser) ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}
function AdminRoute() {
  return useSelector(canAdminister) ? (
    <Outlet />
  ) : (
    <Navigate to="/mail/Inbox" replace />
  );
}
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <SessionGate>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/mail/Inbox" replace />} />
                <Route path="mail/:folder" element={<MailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
                {["contacts", "tasks", "notes", "calendar"].map((kind) => (
                  <Route
                    key={kind}
                    path={kind}
                    element={<WorkspacePage key={kind} kind={kind} />}
                  />
                ))}
                <Route element={<AdminRoute />}>
                  <Route
                    path="admin"
                    element={<Navigate to="/admin/overview" replace />}
                  />
                  <Route path="admin/:section" element={<AdminPage />} />
                </Route>
                <Route
                  path="*"
                  element={
                    <div className="m-auto p-8 text-center">
                      <h1 className="text-2xl font-semibold">Page not found</h1>
                      <a href="/mail/Inbox" className="btn-primary mt-5">
                        Back to inbox
                      </a>
                    </div>
                  }
                />
              </Route>
            </Route>
          </Routes>
          <Notifications />
        </SessionGate>
      </BrowserRouter>
    </Provider>
  );
}
