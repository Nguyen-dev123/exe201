// Mock auth routes for testing without MongoDB
const mockUsers = new Map();

async function mockAuthRoutes(fastify, options) {
  // Mock Register
  fastify.post("/register", async (request, reply) => {
    const { name, email, password } = request.body;

    if (mockUsers.has(email)) {
      return reply.code(400).send({ message: "Email đã tồn tại" });
    }

    const user = {
      _id: Date.now().toString(),
      name,
      email,
      createdAt: new Date(),
    };

    mockUsers.set(email, { ...user, password });

    return reply.code(201).send({
      message: "Đăng ký thành công",
      user,
    });
  });

  // Mock Login
  fastify.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    const userData = mockUsers.get(email);

    if (!userData || userData.password !== password) {
      return reply
        .code(401)
        .send({ message: "Email hoặc mật khẩu không đúng" });
    }

    const { password: _, ...user } = userData;

    // Generate mock token
    const token = Buffer.from(
      JSON.stringify({ userId: user._id, email }),
    ).toString("base64");

    return reply.send({
      message: "Đăng nhập thành công",
      user,
      token,
    });
  });

  // Mock Get Profile
  fastify.get("/profile", async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString());
      const userData = Array.from(mockUsers.values()).find(
        (u) => u._id === decoded.userId,
      );

      if (!userData) {
        return reply.code(404).send({ message: "User not found" });
      }

      const { password: _, ...user } = userData;
      return reply.send({ user });
    } catch (error) {
      return reply.code(401).send({ message: "Invalid token" });
    }
  });
}

module.exports = mockAuthRoutes;
