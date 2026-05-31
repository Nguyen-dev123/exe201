import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import RoomsPage from "./pages/RoomsPage";
import RoomDetailPage from "./pages/RoomDetailPage";
import ProfilePage from "./pages/ProfilePage";
import PricingPage from "./pages/PricingPage";
import DashboardPage from "./pages/DashboardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import BadgesPage from "./pages/BadgesPage";
import RanksPage from "./pages/RanksPage";
import AIPage from "./pages/AIPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminPage from "./pages/AdminPage";
import CommunityPage from "./pages/CommunityPage";
import TestPage from "./pages/TestPage";

function PrivateRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="auth/reset-password/:token"
          element={<ResetPasswordPage />}
        />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route
          path="ranks"
          element={
            <PrivateRoute>
              <RanksPage />
            </PrivateRoute>
          }
        />
        <Route path="community" element={<CommunityPage />} />
        <Route path="test" element={<TestPage />} />

        {/* Payment redirects from PayOS */}
        <Route
          path="payment/success"
          element={<PaymentResultPage status="success" />}
        />
        <Route
          path="payment/failed"
          element={<PaymentResultPage status="failed" />}
        />

        <Route
          path="dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="rooms"
          element={
            <PrivateRoute>
              <RoomsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="rooms/:id"
          element={
            <PrivateRoute>
              <RoomDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="badges"
          element={
            <PrivateRoute>
              <BadgesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="ai"
          element={
            <PrivateRoute>
              <AIPage />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute>
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="admin/payments"
          element={
            <PrivateRoute>
              <AdminPaymentsPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
