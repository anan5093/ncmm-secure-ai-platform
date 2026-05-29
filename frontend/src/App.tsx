import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, useAuthProvider } from "./hooks/useAuth";
import { useAuth } from "./hooks/useAuth";
import { RouteGuard } from "./components/RouteGuard";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import ForbiddenPage from "./pages/ForbiddenPage";

function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

function RootRedirect() {
  const { user } = useAuth();

  if (user?.role === "ROLE_SYSADMIN") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/chat" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route
            path="/admin"
            element={
              <RouteGuard allowedRoles={["ROLE_SYSADMIN"]}>
                <AdminPage />
              </RouteGuard>
            }
          />
          <Route
            path="/chat"
            element={
              <RouteGuard
                allowedRoles={[
                  "ROLE_PORT_INSPECTOR",
                  "ROLE_LOGISTICS_ANALYST",
                  "ROLE_MISSION_DIRECTOR",
                ]}
              >
                <ChatPage />
              </RouteGuard>
            }
          />
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
