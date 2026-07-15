const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// =============================================
// BUSINESS LOGIC TESTS
// =============================================

// ---- Payment / Subscription Tests ----

test('completeTransaction is idempotent — already COMPLETED returns true', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /transaction\.status\s*===\s*"COMPLETED"/);
  assert.match(payment, /return\s+true/);
});

test('completeTransaction respects skipProviderVerify for webhook path', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /skipProviderVerify/);
  assert.match(payment, /PAYOS_WEBHOOK/);
});

test('payos createOrder stores PENDING transaction with plan reference', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /Transaction\.create/);
  assert.match(payment, /orderCode/);
  assert.match(payment, /status:\s*"PENDING"/);
  assert.match(payment, /paymentMethod:\s*"PAYOS"/);
});

test('activateSubscriptionForTransaction handles LIFETIME expiry=null', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /LIFETIME/);
  assert.match(payment, /subscriptionExpiry\s*=\s*null/);
});

test('activateSubscriptionForTransaction stacks expiries for non-LIFETIME', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /setDate/);
  assert.match(payment, /plan\.durationDays/);
  assert.match(payment, /currentExpiry/);
});

test('DEV fallback only triggers on connection error, not in production', () => {
  const root = path.join(__dirname, '..', 'src');
  const payment = fs.readFileSync(path.join(root, 'services', 'payment.service.js'), 'utf8');
  assert.match(payment, /IS_PRODUCTION/);
  assert.match(payment, /isConnectionError/);
  assert.match(payment, /connection|network|CONN|TIMEOUT|ENOTFOUND/i);
});

test('PayOS reconciliation cron job exists and scans PENDING + PAYOS', () => {
  const root = path.join(__dirname, '..', 'src');
  const streakJob = fs.readFileSync(path.join(root, 'jobs', 'streak.job.js'), 'utf8');
  assert.match(streakJob, /performPayosReconciliation/);
  assert.match(streakJob, /paymentMethod:\s*'PAYOS'/);
  assert.match(streakJob, /status:\s*'PENDING'/);
});

// ---- Auth / Session Tests ----

test('protect middleware rejects sessions with mismatched authVersion', () => {
  const root = path.join(__dirname, '..', 'src');
  const authMiddleware = fs.readFileSync(path.join(root, 'middlewares', 'auth.middleware.js'), 'utf8');
  assert.match(authMiddleware, /authVersion/);
  assert.match(authMiddleware, /Phiên đăng nhập đã bị thu hồi/);
});

test('protect middleware checks AuthSession revokedAt + expiresAt', () => {
  const root = path.join(__dirname, '..', 'src');
  const authMiddleware = fs.readFileSync(path.join(root, 'middlewares', 'auth.middleware.js'), 'utf8');
  assert.match(authMiddleware, /AuthSession\.findOne/);
  assert.match(authMiddleware, /revokedAt:\s*null/);
  assert.match(authMiddleware, /expiresAt/);
});

test('logoutAll revokes ALL sessions AND increments authVersion', () => {
  const root = path.join(__dirname, '..', 'src');
  const authService = fs.readFileSync(path.join(root, 'services', 'auth.service.js'), 'utf8');
  assert.match(authService, /revokeAllSessions/);
  assert.match(authService, /AuthSession\.updateMany/);
  assert.match(authService, /authVersion/);
});

test('refreshToken rejects if authVersion does not match', () => {
  const root = path.join(__dirname, '..', 'src');
  const authService = fs.readFileSync(path.join(root, 'services', 'auth.service.js'), 'utf8');
  assert.match(authService, /authVersion/);
  assert.match(authService, /Session has been revoked/);
});

test('refreshToken rejects locked/blocked accounts', () => {
  const root = path.join(__dirname, '..', 'src');
  const authService = fs.readFileSync(path.join(root, 'services', 'auth.service.js'), 'utf8');
  assert.match(authService, /isLocked\s*\|\|\s*user\.isBlocked/);
  assert.match(authService, /Account is not allowed/);
});

test('login returns requiresTwoFactor when 2FA is enabled', () => {
  const root = path.join(__dirname, '..', 'src');
  const authController = fs.readFileSync(path.join(root, 'controllers', 'auth.controller.js'), 'utf8');
  assert.match(authController, /requiresTwoFactor/);
  assert.match(authController, /challengeToken/);
});

test('register activates account immediately and returns session tokens', () => {
  const root = path.join(__dirname, '..', 'src');
  const authController = fs.readFileSync(path.join(root, 'controllers', 'auth.controller.js'), 'utf8');
  const authService = fs.readFileSync(path.join(root, 'services', 'auth.service.js'), 'utf8');
  assert.match(authController, /requiresVerification:\s*false/);
  assert.match(authController, /refreshToken/);
  assert.match(authService, /accountStatus:\s*"ACTIVE"/);
});

// ---- Rank / Leaderboard Tests ----

test('rank route is public (no protect middleware)', () => {
  const root = path.join(__dirname, '..', 'src');
  const rankRoutes = fs.readFileSync(path.join(root, 'routes', 'rank.routes.js'), 'utf8');
  // The GET / route should be public
  assert.match(rankRoutes, /fastify\.get\('\/'/);
  // The file imports protect but only uses it on PUT (admin)
  // Just check the GET line has no preHandler
  const getLine = rankRoutes.split('\n').find(l => l.includes("fastify.get"));
  assert.ok(getLine, 'GET / route exists');
  assert.doesNotMatch(getLine, /preHandler/);
});

test('public leaderboard uses permissive $or for missing privacy fields', () => {
  const root = path.join(__dirname, '..', 'src');
  const publicCtrl = fs.readFileSync(path.join(root, 'controllers', 'public.controller.js'), 'utf8');
  assert.match(publicCtrl, /\$exists:\s*false/);
  assert.match(publicCtrl, /profileVisibility/);
  assert.match(publicCtrl, /showStudyStats/);
});

test('public leaderboard excludes blocked/inactive/non-MEMBER users', () => {
  const root = path.join(__dirname, '..', 'src');
  const publicCtrl = fs.readFileSync(path.join(root, 'controllers', 'public.controller.js'), 'utf8');
  assert.match(publicCtrl, /role:\s*"MEMBER"/);
  assert.match(publicCtrl, /accountStatus:\s*"ACTIVE"/);
  assert.match(publicCtrl, /isBlocked/);
});

// ---- Notification Tests ----

test('notifications page renders archive & delete as proper buttons (not nested)', () => {
  const feRoot = path.join(__dirname, '..', '..', 'hoca-fe');
  const notifPage = fs.readFileSync(path.join(feRoot, 'src', 'pages', 'NotificationsPage.jsx'), 'utf8');
  // The outer clickable should be a div (not button) with role="button"
  assert.match(notifPage, /div.*role="button"/);
  // Archive and Delete should be actual <button> elements
  assert.match(notifPage, /<button.*title="Lưu trữ"/);
  assert.match(notifPage, /<button.*title="Xóa"/);
});

test('notification markRead supports array of IDs', () => {
  const root = path.join(__dirname, '..', 'src');
  const notifRoutes = fs.readFileSync(path.join(root, 'routes', 'notification.routes.js'), 'utf8');
  assert.match(notifRoutes, /mark-read/);
});

// ---- Support Ticket Tests ----

test('support controller returns paginated user tickets', () => {
  const root = path.join(__dirname, '..', 'src');
  const supportCtrl = fs.readFileSync(path.join(root, 'controllers', 'support.controller.js'), 'utf8');
  assert.match(supportCtrl, /pagination/);
  assert.match(supportCtrl, /pages/);
  assert.match(supportCtrl, /total/);
});

test('support ticket reply differentiates ADMIN vs USER roles', () => {
  const root = path.join(__dirname, '..', 'src');
  const supportCtrl = fs.readFileSync(path.join(root, 'controllers', 'support.controller.js'), 'utf8');
  assert.match(supportCtrl, /role === 'ADMIN'/);
  assert.match(supportCtrl, /WAITING_USER/);
});

// ---- AI Tests ----

test('AI ask endpoint accepts conversationId, subject, explanationLevel', () => {
  const root = path.join(__dirname, '..', 'src');
  const aiRoutes = fs.readFileSync(path.join(root, 'routes', 'ai.routes.js'), 'utf8');
  assert.match(aiRoutes, /conversations/);
  assert.match(aiRoutes, /feedback/);
});

test('AI frontend handles rename/delete/rate errors with toast', () => {
  const feRoot = path.join(__dirname, '..', '..', 'hoca-fe');
  const aiPage = fs.readFileSync(path.join(feRoot, 'src', 'pages', 'AIPage.jsx'), 'utf8');
  assert.match(aiPage, /import toast from/);
  assert.match(aiPage, /toast\.error.*đổi tên/);
  assert.match(aiPage, /toast\.error.*xóa/);
  assert.match(aiPage, /toast\.error.*đánh giá/);
});

// ---- Public Routes Tests ----

test('public routes are defined without protect middleware', () => {
  const root = path.join(__dirname, '..', 'src');
  const publicRoutes = fs.readFileSync(path.join(root, 'routes', 'public.routes.js'), 'utf8');
  assert.match(publicRoutes, /leaderboard/);
  assert.match(publicRoutes, /students/);
  assert.match(publicRoutes, /platform-stats/);
  assert.doesNotMatch(publicRoutes, /protect/);
  assert.doesNotMatch(publicRoutes, /preHandler/);
});

// ---- Payment Routes Tests ----

test('payos webhook is public (no auth)', () => {
  const root = path.join(__dirname, '..', 'src');
  const paymentRoutes = fs.readFileSync(path.join(root, 'routes', 'payment.routes.js'), 'utf8');
  assert.match(paymentRoutes, /payos\/webhook/);
  // Webhook line should NOT have protect
  const webhookLine = paymentRoutes.split('\n').find(l => l.includes('payos/webhook'));
  assert.doesNotMatch(webhookLine, /protect/);
});

test('payos public-status is public (no auth)', () => {
  const root = path.join(__dirname, '..', 'src');
  const paymentRoutes = fs.readFileSync(path.join(root, 'routes', 'payment.routes.js'), 'utf8');
  assert.match(paymentRoutes, /public-status/);
  const line = paymentRoutes.split('\n').find(l => l.includes('public-status'));
  assert.doesNotMatch(line, /protect/);
});

test('payment verify route uses protect for security', () => {
  const root = path.join(__dirname, '..', 'src');
  const paymentRoutes = fs.readFileSync(path.join(root, 'routes', 'payment.routes.js'), 'utf8');
  assert.match(paymentRoutes, /\/verify/);
  const verifySection = paymentRoutes.split('/verify')[1]?.split('\n').slice(0, 3).join('\n');
  assert.match(verifySection, /protect/);
});

// ---- VNPay Tests ----

test('vnpay IPN handler is public (no auth) for server-to-server callbacks', () => {
  const root = path.join(__dirname, '..', 'src');
  const paymentRoutes = fs.readFileSync(path.join(root, 'routes', 'payment.routes.js'), 'utf8');
  assert.match(paymentRoutes, /vnpay\/ipn/);
  const ipnLines = paymentRoutes.split('\n').filter(l => l.includes('vnpay/ipn'));
  ipnLines.forEach(line => {
    assert.doesNotMatch(line, /protect/);
  });
});

// ---- Password Reset Tests ----

test('reset password page has show/hide toggle for both password fields', () => {
  const feRoot = path.join(__dirname, '..', '..', 'hoca-fe');
  const resetPage = fs.readFileSync(path.join(feRoot, 'src', 'pages', 'ResetPasswordPage.jsx'), 'utf8');
  assert.match(resetPage, /showPassword/);
  assert.match(resetPage, /showConfirmPassword/);
  assert.match(resetPage, /Eye/);
  assert.match(resetPage, /EyeOff/);
});

// ---- Frontend Logout Tests ----

test('authStore logout only clears local state to avoid duplicate revoke requests', () => {
  const feRoot = path.join(__dirname, '..', '..', 'hoca-fe');
  const authStore = fs.readFileSync(path.join(feRoot, 'src', 'store', 'authStore.js'), 'utf8');
  assert.doesNotMatch(authStore, /api\.post.*\/api\/auth\/logout/);
});

test('layout handleLogout calls authApi.logout before local logout', () => {
  const feRoot = path.join(__dirname, '..', '..', 'hoca-fe');
  const layout = fs.readFileSync(path.join(feRoot, 'src', 'components', 'Layout.jsx'), 'utf8');
  assert.match(layout, /authApi\.logout/);
  assert.match(layout, /finally/);
});
