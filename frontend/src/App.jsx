import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import Layout from "./components/layout/Layout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Events from "./pages/events/Events";
import EventDetail from "./pages/events/EventDetail";
import CreateEvent from "./pages/events/CreateEvent";
import Guests from "./pages/guests/Guests";
import GuestDetail from "./pages/guests/GuestDetail";
import Contributions from "./pages/contributions/Contributions";
import Transactions from "./pages/transactions/Transactions";
import Invitations from "./pages/invitations/Invitations";
import CheckIn from "./pages/checkin/CheckIn";
import Reminders from "./pages/reminders/Reminders";
import Notifications from "./pages/notifications/Notifications";
import Reports from "./pages/reports/Reports";
import Payouts from "./pages/payouts/Payouts";
import Users from "./pages/users/Users";
import AuditLogs from "./pages/audit/AuditLogs";
import EventOwners from "./pages/event-owners/EventOwners";
import ContributionPage from "./pages/public/ContributionPage";
import VerifyPage from "./pages/public/VerifyPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const RoleBasedRedirect = () => {
  const { user } = useAuthStore();
  if (user?.role === "EVENT_OWNER") {
    return <Navigate to="/events" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: "14px",
            borderRadius: "10px",
            padding: "12px 16px",
          },
          success: {
            iconTheme: { primary: "#22c55e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/contribute/:token" element={<ContributionPage />} />
        <Route path="/checkin/verify/:token" element={<VerifyPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/create" element={<CreateEvent />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="guests" element={<Guests />} />
          <Route path="guests/:id" element={<GuestDetail />} />
          <Route path="contributions" element={<Contributions />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="invitations" element={<Invitations />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="payouts" element={<Payouts />} />
          <Route path="event-owners" element={<EventOwners />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<AuditLogs />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;