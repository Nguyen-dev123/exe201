import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyOtpPage = lazy(() => import("./pages/VerifyOtpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const RoomsPage = lazy(() => import("./pages/RoomsPage"));
const RoomDetailPage = lazy(() => import("./pages/RoomDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const RanksPage = lazy(() => import("./pages/RanksPage"));
const AIPage = lazy(() => import("./pages/AIPage"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const PublicProfilePage = lazy(() => import("./pages/PublicProfilePage"));
const TestPage = import.meta.env.DEV
  ? lazy(() => import(/* @vite-ignore */ "./pages/TestPage.jsx"))
  : null;
const SocketDebugPage = lazy(() => import("./pages/SocketDebugPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function AdminPageLoader() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-56 rounded-xl" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="skeleton h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function DevOrAdminRoute({ children }) {
  const { user } = useAuthStore();
  if (import.meta.env.DEV) return children;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "ADMIN" ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<AdminPageLoader />}>
        <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="auth/verify" element={<VerifyOtpPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
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
        <Route path="support" element={<SupportPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="terms" element={<LegalPage type="terms" />} />
        <Route path="privacy" element={<LegalPage type="privacy" />} />
        <Route path="students/:id" element={<PublicProfilePage />} />
        {import.meta.env.DEV && <Route path="test" element={<TestPage />} />}
        <Route
          path="socket-debug"
          element={
            <DevOrAdminRoute>
              <SocketDebugPage />
            </DevOrAdminRoute>
          }
        />

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
            <AdminRoute>
              <Suspense fallback={<AdminPageLoader />}>
                <AdminPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="admin/payments"
          element={<Navigate to="/admin?tab=payments" replace />}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
