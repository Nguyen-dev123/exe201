const buildApp = require("./app");
const connectDatabase = require("./config/database");
const { PORT, CLIENT_URL } = require("./config/env");
const { Server } = require("socket.io");

const startServer = async () => {
  try {
    // 1. Connect to Database
    const dbConnected = await connectDatabase();

    // Seed Ranks only if DB is connected
    if (dbConnected !== false) {
      try {
        const { seedDefaultRanks } = require("./services/rank.service");
        await seedDefaultRanks();
      } catch (err) {
        console.log("⚠️  Skipping seed (no database)");
      }
    }

    // 2. Build Fastify App
    const app = await buildApp();

    // 3. Start Listening
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    // 4. Setup Socket.io
    const allowedOrigins = [
      "http://localhost:3000",
      "https://hoca.asia",
      "https://www.hoca.asia",
      CLIENT_URL,
    ].filter(Boolean);

    const io = new Server(app.server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl)
          if (!origin) return callback(null, true);
          const staticAllowed = [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://hoca.asia",
            "https://www.hoca.asia",
            CLIENT_URL,
          ].filter(Boolean);
          const isLanOrigin =
            /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
              origin,
            );
          const isTunnelOrigin =
            /\.(trycloudflare\.com|ngrok\.io|ngrok-free\.app|loca\.lt|vercel\.app)$/.test(
              origin,
            );
          if (staticAllowed.includes(origin) || isLanOrigin || isTunnelOrigin) {
            return callback(null, true);
          }
          return callback(new Error("Not allowed by CORS"), false);
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000, // 60s - time to wait for ping response
      pingInterval: 25000, // 25s - interval between pings
      upgradeTimeout: 30000,
      allowUpgrades: true,
      transports: ["polling", "websocket"], // Polling first for better compatibility
      connectTimeout: 45000,
    });

    require("./socket")(io);

    // 5. Init Jobs and pass io instance for room auto-close notifications (only if DB connected)
    if (dbConnected !== false) {
      try {
        const { initJobs, setIoInstance } = require("./jobs/streak.job");
        setIoInstance(io);
        initJobs();

        // 6. Init Cleanup Job (delete unverified accounts after 24h)
        const { startCleanupJob } = require("./jobs/cleanup.job");
        startCleanupJob();
      } catch (err) {
        console.log("⚠️  Skipping cron jobs (no database)");
      }
    }

    global.io = io;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();
