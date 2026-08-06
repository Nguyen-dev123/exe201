import { expect, test } from "@playwright/test";

test("trang chủ và điều hướng công khai hiển thị được", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HOCA/);
  await expect(page.locator("body")).toContainText("HOCA");
});

test("route riêng chuyển người chưa đăng nhập về trang đăng nhập", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("form đăng nhập hiển thị lỗi validation và dùng được bằng bàn phím", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Vui lòng nhập email.")).toBeVisible();
  await expect(page.getByText("Vui lòng nhập mật khẩu.")).toBeVisible();
});

test("các trang công khai quan trọng mở được", async ({ page }) => {
  for (const route of ["/pricing", "/leaderboard", "/community", "/support", "/status", "/terms", "/privacy"]) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("404");
  }
});

test("khách không thể mở trực tiếp khu vực admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
});

test("form đăng ký và quên mật khẩu có validation phía client", async ({ page }) => {
  await page.goto("/register");
  const registerForm = page.locator("form").first();
  await expect(registerForm.getByLabel("Email")).toBeVisible();
  await expect(registerForm.getByRole("button", { name: "Tạo tài khoản", exact: true })).toBeVisible();
  await page.goto("/forgot-password");
  const forgotForm = page.locator("form").first();
  await expect(forgotForm.getByLabel("Email")).toHaveAttribute("required", "");
  await expect(forgotForm.getByRole("button", { name: "Gửi liên kết khôi phục", exact: true })).toBeVisible();
});
