const fastify = require("fastify");
const cors = require("@fastify/cors");
const jwt = require("@fastify/jwt");
const multipart = require("@fastify/multipart");
const rateLimit = require("@fastify/rate-limit");
const { JWT_SECRET, CLIENT_URL, NODE_ENV } = require("./config/env");
const { globalRateLimit } = require("./config/rateLimit");
// Register Models
require("./models/User");
require("./models/Badge");
require("./models/Room");
require("./models/RoomCategory");
require("./models/Transaction");
require("./models/Report");
require("./models/SystemConfig");
require("./models/Message");
require("./models/Rank");
require("./models/Notification");
require("./models/AIUsage"); // NEW: AI Usage tracking
require("./models/Feedback");
require("./models/NewsletterSubscriber");
require("./models/DiscussionSession");
require("./models/StudyGoal");
require("./models/CommunityReaction");
require("./models/AIConversation");
require("./models/SupportTicket");
require("./models/AuthSession");
require("./models/RoomInvite");
require("./models/RoomRating");
const logger = require("./middlewares/logger.middleware");
const buildApp = async () => {
  const app = fastify();

  // Register Rate Limiting (Global)
  await app.register(rateLimit, globalRateLimit);

  // Register Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });
  // Register Middleware
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://hoca.asia",
        "https://www.hoca.asia",
        "https://hoca-six.vercel.app",
        CLIENT_URL,
      ];

      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return cb(null, true);

      // Allow any local network origin (LAN IPs) so phones on the same WiFi can connect.
      // Matches http(s)://localhost, 127.x, 10.x, 192.168.x, 172.16-31.x on any port.
      const isLanOrigin = NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        );

      // Allow public tunnel domains (Cloudflare quick tunnels, ngrok, localtunnel)
      // and Vercel deployments (production + preview)
      const isTunnelOrigin = NODE_ENV !== "production" &&
        /\.(trycloudflare\.com|ngrok\.io|ngrok-free\.app|loca\.lt|vercel\.app)$/.test(
          origin,
        );

      if (allowedOrigins.includes(origin) || isLanOrigin || isTunnelOrigin) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.register(logger);

  await app.register(jwt, {
    secret: JWT_SECRET,
  });

  // Health Check
  app.get("/", async () => {
    return {
      message: "HOCA Backend API",
      status: "running",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        api: "/api/*",
      },
    };
  });

  let emailHealthCache = { status: "down", checkedAt: 0 };
  app.get("/health", async (request, reply) => {
    const mongoose = require("mongoose");
    const emailService = require("./services/email.service");
    const paymentService = require("./services/payment.service");
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require("./config/env");
    const configuredValue = (value) => Boolean(value && !/your-|placeholder|example|localhost/i.test(value));
    if (Date.now() - emailHealthCache.checkedAt > 60_000) {
      try {
        await emailService.verifyConnection();
        emailHealthCache = { status: "operational", checkedAt: Date.now() };
      } catch {
        emailHealthCache = { status: "down", checkedAt: Date.now() };
      }
    }
    const checks = {
      api: { status: "operational" },
      database: { status: mongoose.connection.readyState === 1 ? "operational" : "down" },
      socket: { status: global.io ? "operational" : "down" },
      ai: {
        status: process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY ? "operational" : "degraded",
        message: process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY ? undefined : "Using fallback provider",
      },
      email: { status: emailHealthCache.status },
      payment: {
        status: paymentService.PAYOS_CONFIGURED || paymentService.VNPAY_ENABLED ? "operational" : "down",
      },
      upload: {
        status: [CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET].every(configuredValue) ? "operational" : "down",
      },
    };
    if (checks.database.status === "operational") {
      try {
        await mongoose.connection.db.admin().ping();
      } catch {
        checks.database.status = "down";
      }
    }
    const statuses = Object.values(checks).map((item) => item.status);
    const status = statuses.includes("down") ? "degraded" :
      statuses.includes("degraded") ? "degraded" : "operational";
    const payload = {
      status,
      services: checks,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
    return reply.code(status === "operational" ? 200 : 503).send(payload);
  });

  // Register Routes
  // Mock auth is opt-in for local development only. Never issue fake sessions
  // when the production database is unavailable.
  const mongoose = require("mongoose");
  const allowMockAuth =
    NODE_ENV !== "production" && process.env.ALLOW_MOCK_AUTH === "true";
  if (mongoose.connection.readyState === 0 && allowMockAuth) {
    console.log("⚠️  Using mock auth routes (no database)");
    app.register(require("./routes/mock-auth.routes"), { prefix: "/api/auth" });
  } else {
    app.register(require("./routes/auth.routes"), { prefix: "/api/auth" });
  }

  app.register(require("./routes/user.routes"), { prefix: "/api/users" });
  app.register(require("./routes/room.routes"), { prefix: "/api/rooms" });
  app.register(require("./routes/feedback.routes"), {
    prefix: "/api/feedback",
  });
  app.register(require("./routes/payment.routes"), { prefix: "/api/payment" });
  app.register(require("./routes/pricing.routes"), { prefix: "/api/pricing" });
  app.register(require("./routes/report.routes"), { prefix: "/api/reports" });
  app.register(require("./routes/admin.routes"), { prefix: "/api/admin" });
  app.register(require("./routes/ads.routes"), { prefix: "/api/ads" });
  app.register(require("./routes/badge.routes"), { prefix: "/api/badges" });
  app.register(require("./routes/chat.routes"), { prefix: "/api/chat" });
  app.register(require("./routes/quote.routes"), { prefix: "/api/quotes" });
  app.register(require("./routes/upload.routes"), { prefix: "/api/upload" });
  app.register(require("./routes/rank.routes"), { prefix: "/api/ranks" });
  app.register(require("./routes/notification.routes"), {
    prefix: "/api/notifications",
  });
  app.register(require("./routes/cron.routes"), { prefix: "/api/cron" });
  app.register(require("./routes/ai.routes"), { prefix: "/api/ai" }); // NEW: AI Study Assistant
  app.register(require("./routes/sticker.routes"), { prefix: "/api/stickers" });
  app.register(require("./routes/reaction.routes"), {
    prefix: "/api/reactions",
  });
  app.register(require("./routes/public.routes"), { prefix: "/api/public" });
  app.register(require("./routes/download.routes"), {
    prefix: "/api/download",
  });
  app.register(require("./routes/discussion.routes"), {
    prefix: "/api/discussions",
  });
  app.register(require("./routes/study-goal.routes"), {
    prefix: "/api/study-goals",
  });
  app.register(require("./routes/support.routes"), { prefix: "/api/support" });

  return app;
};

module.exports = buildApp;
