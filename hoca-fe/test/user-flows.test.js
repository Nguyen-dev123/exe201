import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("public leaderboard uses the public API and renders an error state", () => {
  const page = read("src/pages/LeaderboardPage.jsx");
  assert.match(page, /publicApi\.getLeaderboard/);
  assert.match(page, /isError/);
  assert.match(page, /refetch/);
});

test("payment result checks a session-independent PayOS status endpoint", () => {
  const page = read("src/pages/PaymentResultPage.jsx");
  assert.match(page, /publicPayosStatus/);
  assert.match(page, /COMPLETED/);
});

test("login only displays Google login when a client id is configured", () => {
  const page = read("src/pages/LoginPage.jsx");
  const config = read("src/lib/googleOAuth.js");
  assert.match(config, /VITE_GOOGLE_CLIENT_ID/);
  assert.match(config, /CLIENT_ID_PATTERN/);
  assert.match(page, /GOOGLE_LOGIN_ENABLED/);
  assert.match(page, /GoogleLogin/);
  assert.match(page, /handleGoogleSuccess/);
});

test("reset password provides independent visibility toggles", () => {
  const page = read("src/pages/ResetPasswordPage.jsx");
  assert.match(page, /showPassword/);
  assert.match(page, /showConfirmPassword/);
  assert.match(page, /aria-pressed/);
});

test("support tickets expose pagination and an error retry", () => {
  const page = read("src/pages/SupportPage.jsx");
  assert.match(page, /ticketPagination/);
  assert.match(page, /ticketsError/);
  assert.match(page, /Thử lại/);
});

test("notification actions are real buttons and not nested in a button", () => {
  const page = read("src/pages/NotificationsPage.jsx");
  assert.match(page, /role="button"/);
  assert.match(page, /title="Lưu trữ"/);
  assert.match(page, /title="Xóa"/);
  assert.doesNotMatch(page, /data\.notifications\.map\([^\n]*<button key=/);
});

test("admin support center connects list, detail, reply and status APIs", () => {
  const page = read("src/pages/AdminPage.jsx");
  const services = read("src/lib/services.js");
  assert.match(page, /SupportTicketsTab/);
  assert.match(page, /supportApi\.adminList/);
  assert.match(page, /supportApi\.reply/);
  assert.match(page, /supportApi\.setStatus/);
  assert.match(services, /\/api\/support\/admin/);
});

test("admin tools expose previously unused backend capabilities", () => {
  const tools = read("src/components/AdminSystemTools.jsx");
  const services = read("src/lib/services.js");
  for (const method of ["getAnalytics", "getSystemConfig", "updateSystemConfig", "getTransactions", "getNotifications", "getAdViews"]) {
    assert.match(tools, new RegExp(`adminApi\\.${method}`));
    assert.match(services, new RegExp(`${method}:`));
  }
  for (const method of ["markNotificationsRead", "archiveNotification", "deleteNotification"]) {
    assert.match(tools, new RegExp(`adminApi\\.${method}`));
    assert.match(services, new RegExp(`${method}:`));
  }
  assert.doesNotMatch(tools, /notificationApi/);
  assert.match(services, /toggleAdPlacementEnabled/);
});

test("room production pages do not contain debug console calls", () => {
  const source = read("src/pages/RoomsPage.jsx") + read("src/pages/RoomDetailPage.jsx");
  assert.doesNotMatch(source, /console\.(log|error)/);
});
