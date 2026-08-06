const BACKEND_URL = "https://hoca-backend-d1fg.onrender.com";
const ALLOWED_ORIGINS = new Set([
  "https://hoca-fe.vercel.app",
  "https://hoca.asia",
  "https://www.hoca.asia",
  "https://localhost",
  "capacitor://localhost",
]);

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path || "";
  const targetUrl = new URL(`/api/${path}`, BACKEND_URL);
  for (const [name, value] of Object.entries(req.query)) {
    if (name !== "path") targetUrl.searchParams.append(name, String(value));
  }

  const headers = {};
  for (const name of ["authorization", "content-type", "user-agent"]) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  const clientIp = req.headers["x-forwarded-for"];
  if (clientIp) headers["x-forwarded-for"] = clientIp;
  const init = { method: req.method, headers };
  if (!["GET", "HEAD"].includes(req.method)) {
    if (Buffer.isBuffer(req.body) || typeof req.body === "string") {
      init.body = req.body;
    } else if (req.body !== undefined && req.body !== null) {
      init.body = JSON.stringify(req.body);
      headers["content-type"] ||= "application/json";
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }
  }

  try {
    const upstream = await fetch(targetUrl, init);
    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(name)) res.setHeader(name, value);
    });
    setCors(req, res);
    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Length", responseBody.length);
    res.end(responseBody);
  } catch {
    res.status(502).json({ message: "Không thể kết nối máy chủ. Vui lòng thử lại." });
  }
}
