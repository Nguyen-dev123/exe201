import { expect, test } from "@playwright/test";
import { io } from "socket.io-client";

const apiUrl = process.env.E2E_API_URL;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const userEmail = process.env.E2E_USER_EMAIL;
const userPassword = process.env.E2E_USER_PASSWORD;
const peerEmail = process.env.E2E_PEER_EMAIL;
const peerPassword = process.env.E2E_PEER_PASSWORD;
const databaseName = process.env.E2E_DATABASE_NAME || "";
const enabled = Boolean(apiUrl && adminEmail && adminPassword && userEmail && userPassword && peerEmail && peerPassword && process.env.E2E_ALLOW_MUTATIONS === "true" && /(e2e|test)/i.test(databaseName));

test.describe("real isolated API workflows", () => {
  test.skip(!enabled, "Cần database có tên chứa test/e2e, ba tài khoản và E2E_ALLOW_MUTATIONS=true.");

  async function login(request, email, password) {
    const response = await request.post(`${apiUrl}/api/auth/login`, { data: { email, password } });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    return body.accessToken || body.token;
  }

  function waitFor(socket, event, timeout = 8000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
      socket.once(event, (payload) => { clearTimeout(timer); resolve(payload); });
    });
  }

  test("đăng nhập thật và phân quyền MEMBER/ADMIN", async ({ request }) => {
    const userToken = await login(request, userEmail, userPassword);
    const adminToken = await login(request, adminEmail, adminPassword);
    const denied = await request.get(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${userToken}` } });
    expect(denied.status()).toBe(403);
    const allowed = await request.get(`${apiUrl}/api/admin/stats`, { headers: { Authorization: `Bearer ${adminToken}` } });
    expect(allowed.ok()).toBeTruthy();
  });

  test("vòng đời phòng nhiều tài khoản, lời mời và báo cáo", async ({ request }) => {
    const token = await login(request, userEmail, userPassword);
    const peerToken = await login(request, peerEmail, peerPassword);
    const adminToken = await login(request, adminEmail, adminPassword);
    const headers = { Authorization: `Bearer ${token}` };
    const peerHeaders = { Authorization: `Bearer ${peerToken}` };
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const room = await request.post(`${apiUrl}/api/rooms`, { headers, data: { name: `E2E Room ${Date.now()}`, maxParticipants: 4, isPublic: true } });
    expect(room.ok()).toBeTruthy();
    const roomBody = await room.json();
    const roomId = roomBody.room?._id || roomBody._id;
    expect(roomId).toBeTruthy();
    const invite = await request.post(`${apiUrl}/api/rooms/${roomId}/invites`, { headers, data: { email: peerEmail } });
    expect(invite.status()).toBe(201);
    const inviteBody = await invite.json();
    expect((await request.patch(`${apiUrl}/api/rooms/invitations/${inviteBody._id}`, { headers: peerHeaders, data: { status: "ACCEPTED" } })).ok()).toBeTruthy();
    expect((await request.post(`${apiUrl}/api/rooms/${roomId}/join`, { headers: peerHeaders, data: {} })).ok()).toBeTruthy();
    const me = await request.get(`${apiUrl}/api/users/me`, { headers: peerHeaders });
    const peer = await me.json();
    const report = await request.post(`${apiUrl}/api/reports`, { headers: peerHeaders, data: { targetUser: peer._id || peer.id, room: roomId, reason: "OTHER", description: "E2E report workflow" } });
    expect(report.status()).toBe(201);
    const reportBody = await report.json();
    expect((await request.put(`${apiUrl}/api/reports/${reportBody._id}`, { headers: adminHeaders, data: { status: "DISMISSED", resolutionNotes: "E2E verified", action: "NONE" } })).ok()).toBeTruthy();
    expect((await request.post(`${apiUrl}/api/rooms/${roomId}/leave`, { headers: peerHeaders })).ok()).toBeTruthy();
    expect((await request.post(`${apiUrl}/api/rooms/${roomId}/close`, { headers })).ok()).toBeTruthy();
    expect((await request.delete(`${apiUrl}/api/rooms/${roomId}`, { headers })).ok()).toBeTruthy();

    const ticket = await request.post(`${apiUrl}/api/support`, { headers, data: { subject: "E2E support", message: "Kiểm tra workflow support" } });
    expect(ticket.ok()).toBeTruthy();
    const ticketBody = await ticket.json();
    expect((await request.post(`${apiUrl}/api/support/${ticketBody._id}/reply`, { headers, data: { message: "Bổ sung thông tin" } })).ok()).toBeTruthy();
  });

  test("admin mutations update and restore database state", async ({ request }) => {
    const adminToken = await login(request, adminEmail, adminPassword);
    const headers = { Authorization: `Bearer ${adminToken}` };
    const beforeResponse = await request.get(`${apiUrl}/api/admin/config`, { headers });
    expect(beforeResponse.ok()).toBeTruthy();
    const before = await beforeResponse.json();
    const marker = { ...(before.e2eVerification || {}), runAt: new Date().toISOString() };
    try {
      const update = await request.put(`${apiUrl}/api/admin/config`, { headers, data: { ...before, e2eVerification: marker } });
      expect(update.ok()).toBeTruthy();
      const after = await (await request.get(`${apiUrl}/api/admin/config`, { headers })).json();
      expect(after.e2eVerification).toEqual(marker);
      expect((await request.get(`${apiUrl}/api/admin/analytics?type=growth&days=7`, { headers })).ok()).toBeTruthy();
      expect((await request.get(`${apiUrl}/api/admin/revenue/transactions?page=1&limit=2`, { headers })).ok()).toBeTruthy();
    } finally {
      await request.put(`${apiUrl}/api/admin/config`, { headers, data: before });
    }
  });

  test("AI provider thật trừ quota và upload yêu cầu phiên hợp lệ", async ({ request }) => {
    const token = await login(request, userEmail, userPassword);
    const headers = { Authorization: `Bearer ${token}` };
    const status = await request.get(`${apiUrl}/api/ai/status`, { headers });
    expect(status.ok()).toBeTruthy();
    const before = await status.json();
    const answer = await request.post(`${apiUrl}/api/ai/ask`, { headers, data: { question: "Trả lời đúng một từ: HOCA", subject: "general", explanationLevel: "short" } });
    expect(answer.ok()).toBeTruthy();
    const answerBody = await answer.json();
    expect(answerBody.answer || answerBody.response).toBeTruthy();
    const after = await (await request.get(`${apiUrl}/api/ai/status`, { headers })).json();
    expect(after.used).toBe(before.used + 1);
    expect(after.remaining).toBe(before.remaining - 1);
    const anonymousUpload = await request.post(`${apiUrl}/api/upload/avatar`, { multipart: { file: { name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") } } });
    expect([400, 401, 403, 415]).toContain(anonymousUpload.status());
  });

  test("socket, chat và WebRTC signaling hoạt động giữa hai tài khoản", async ({ request }) => {
    const userToken = await login(request, userEmail, userPassword);
    const peerToken = await login(request, peerEmail, peerPassword);
    const headers = { Authorization: `Bearer ${userToken}` };
    const roomResponse = await request.post(`${apiUrl}/api/rooms`, { headers, data: { name: `E2E Socket ${Date.now()}`, roomType: "VIDEO", maxParticipants: 4, isPublic: true } });
    expect(roomResponse.status()).toBe(201);
    const room = await roomResponse.json();
    const roomId = room._id;
    const userSocket = io(apiUrl, { transports: ["websocket"], auth: { token: userToken }, forceNew: true });
    const peerSocket = io(apiUrl, { transports: ["websocket"], auth: { token: peerToken }, forceNew: true });
    try {
      await Promise.all([waitFor(userSocket, "connected"), waitFor(peerSocket, "connected")]);
      const userReady = waitFor(userSocket, "room-users");
      userSocket.emit("join-room", { roomId });
      await userReady;
      const peerReady = waitFor(peerSocket, "room-users");
      peerSocket.emit("join-room", { roomId });
      await peerReady;

      const chatReceived = waitFor(peerSocket, "chat-message");
      userSocket.emit("chat-message", { roomId, message: "E2E realtime chat", type: "TEXT" });
      expect((await chatReceived).message).toBe("E2E realtime chat");

      const signalReceived = waitFor(peerSocket, "signal");
      userSocket.emit("signal", { roomId, to: peerSocket.id, signal: { type: "offer", sdp: "e2e-sdp" } });
      const signal = await signalReceived;
      expect(signal.signal).toEqual({ type: "offer", sdp: "e2e-sdp" });
      expect(signal.from).toBe(userSocket.id);
    } finally {
      userSocket.disconnect();
      peerSocket.disconnect();
      await request.post(`${apiUrl}/api/rooms/${roomId}/close`, { headers });
      await request.delete(`${apiUrl}/api/rooms/${roomId}`, { headers });
    }
  });
});
