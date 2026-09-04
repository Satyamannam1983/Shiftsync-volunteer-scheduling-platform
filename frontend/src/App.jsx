import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProgramsPage from "./pages/ProgramsPage";
import ProgramFormPage from "./pages/ProgramFormPage";
import ProgramDetailsPage from "./pages/ProgramDetailsPage";
import RecurringPage from "./pages/RecurringPage";
import ShiftsPage from "./pages/ShiftsPage";
import ShiftFormPage from "./pages/ShiftFormPage";
import ShiftDetailsPage from "./pages/ShiftDetailsPage";
import AlertsPage from "./pages/AlertsPage";
import MySignupsPage from "./pages/MySignupsPage";

const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const Guest = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <LoginPage />
          </Guest>
        }
      />
      <Route
        path="/register"
        element={
          <Guest>
            <RegisterPage />
          </Guest>
        }
      />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route
          path="/programs/new"
          element={
            <Protected roles={["coordinator"]}>
              <ProgramFormPage />
            </Protected>
          }
        />
        <Route
          path="/programs/:id/edit"
          element={
            <Protected roles={["coordinator"]}>
              <ProgramFormPage />
            </Protected>
          }
        />
        <Route path="/programs/:id" element={<ProgramDetailsPage />} />
        <Route
          path="/programs/:id/recurring"
          element={
            <Protected roles={["coordinator"]}>
              <RecurringPage />
            </Protected>
          }
        />
        <Route path="/shifts" element={<ShiftsPage />} />
        <Route
          path="/shifts/new"
          element={
            <Protected roles={["coordinator"]}>
              <ShiftFormPage />
            </Protected>
          }
        />
        <Route
          path="/shifts/:id/edit"
          element={
            <Protected roles={["coordinator"]}>
              <ShiftFormPage />
            </Protected>
          }
        />
        <Route path="/shifts/:id" element={<ShiftDetailsPage />} />
        <Route
          path="/alerts"
          element={
            <Protected roles={["coordinator"]}>
              <AlertsPage />
            </Protected>
          }
        />
        <Route path="/my-signups" element={<MySignupsPage />} />
      </Route>
    </Routes>
  );
}
