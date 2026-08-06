import { expect, test } from "@playwright/test";

const adminUser = { _id: "admin-e2e", displayName: "Admin E2E", email: "admin-e2e@hoca.test", role: "ADMIN" };

async function authenticateAdmin(page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(adminUser.email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2ePassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function mockAdminApi(page) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/api/auth/login") return json({ user: adminUser, token: "e2e-token", refreshToken: "e2e-refresh" });
    if (path === "/api/users/me") return json(adminUser);
    if (path === "/api/admin/analytics") {
      const type = url.searchParams.get("type");
      if (type === "growth") return json({ labels: ["01/07", "02/07"], newUsers: [2, 3], totalNewUsers: 5, activeUsers: 4, mau: 12 });
      if (type === "study_hours") return json({ labels: ["01/07", "02/07"], studyHours: [6, 9] });
      if (type === "engagement") return json({ retentionRate: 62.5, avgSessionTime: "42m", retentionTrend: [{ week: "Tuần -1", rate: 58 }, { week: "Tuần 0", rate: 63 }] });
      return json({ totalHoursLast7Days: 15 });
    }
    if (path === "/api/admin/config" && request.method() === "GET") return json({ maintenanceMode: false, aiDailyLimit: 15, featureFlags: { rooms: true } });
    if (path === "/api/admin/config" && request.method() === "PUT") return json({ message: "Config updated" });
    if (path === "/api/admin/revenue/transactions") return json({ transactions: [{ _id: "tx1", id: "HOCA-001", user: { displayName: "User Test", email: "user@hoca.test" }, amount: 99000, type: "SUBSCRIPTION", status: "COMPLETED", date: new Date().toISOString() }], total: 21, page: 1, pages: 3 });
    if (path === "/api/admin/notifications") return json({ notifications: [{ _id: "n1", title: "Cảnh báo đăng nhập", message: "Phát hiện đăng nhập thất bại", isRead: false, createdAt: new Date().toISOString() }], unreadCount: 1, pagination: { page: 1, pages: 1 } });
    if (path === "/api/admin/ads/views") return json({ stats: { totalViews: 100, totalClicks: 8, ctr: 8, completionRate: 72 }, views: [] });
    if (path === "/api/notifications/mark-read") return json({ success: true });
    if (path.endsWith("/archive") || (path.startsWith("/api/notifications/") && request.method() === "DELETE")) return json({ success: true });
    if (path === "/api/support/admin") return json([{ _id: "ticket1", code: "HOCA-E2E", subject: "Cần hỗ trợ", status: "OPEN", updatedAt: new Date().toISOString(), user: { displayName: "User Test", email: "user@hoca.test" } }]);
    if (path === "/api/support/ticket1" && request.method() === "GET") return json({ _id: "ticket1", code: "HOCA-E2E", subject: "Cần hỗ trợ", status: "OPEN", user: { displayName: "User Test" }, messages: [{ _id: "m1", role: "USER", content: "Tôi không vào được phòng", createdAt: new Date().toISOString() }] });
    if (path === "/api/support/ticket1/reply" || path === "/api/support/ticket1/status") return json({ success: true });
    return json([]);
  });
}

test.beforeEach(async ({ page }) => { await mockAdminApi(page); await authenticateAdmin(page); });

test("admin quản lý analytics, giao dịch, config và thông báo", async ({ page }) => {
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hoca-auth"))?.state?.user?.role)).toBe("ADMIN");
  await page.goto("/admin?tab=system");
  await expect(page).toHaveURL(/\/admin\?tab=system/);
  await expect(page.getByText("Analytics nâng cao")).toBeVisible();
  await expect(page.getByText("62.5%")).toBeVisible();
  await page.getByPlaceholder("Tìm theo mã giao dịch").fill("HOCA-001");
  await expect(page.getByText("HOCA-001")).toBeVisible();
  await expect(page.getByText("Cảnh báo đăng nhập")).toBeVisible();
  await page.getByLabel("Lưu trữ").click();
  await expect(page.getByText("Đã lưu trữ")).toBeVisible();
  await page.getByLabel("maintenanceMode").selectOption("true");
  await page.getByRole("button", { name: "Lưu cấu hình" }).click();
  await expect(page.getByText("Đã lưu cấu hình hệ thống")).toBeVisible();
});

test("admin xử lý ticket hỗ trợ từ đầu đến cuối", async ({ page }) => {
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hoca-auth"))?.state?.user?.role)).toBe("ADMIN");
  await page.goto("/admin?tab=support");
  await expect(page).toHaveURL(/\/admin\?tab=support/);
  await page.getByRole("button", { name: /HOCA-E2E/ }).click();
  await expect(page.getByText("Tôi không vào được phòng")).toBeVisible();
  await page.getByPlaceholder("Nhập nội dung hỗ trợ...").fill("HOCA đang kiểm tra cho bạn.");
  await page.getByRole("button", { name: "Gửi phản hồi" }).click();
  await expect(page.getByText("Đã gửi phản hồi")).toBeVisible();
});
