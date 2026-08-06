const http = require("http");
const fs = require("fs");
const path = require("path");

const files = {
  "/HOCA.apk": {
    path: path.join(__dirname, "HOCA.apk"),
    // Force mobile/in-app browsers to save the APK instead of trying to preview it.
    type: "application/octet-stream",
    name: "HOCA.apk",
  },
  "/HOCA.zip": {
    path: path.join(__dirname, "HOCA.zip"),
    type: "application/zip",
    name: "HOCA.zip",
  },
};

const trackDownload = (req, source) =>
  new Promise((resolve) => {
    const forwardedFor =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "";
    const trackReq = http.get(
      `http://localhost:3000/api/download/track?source=${encodeURIComponent(source)}`,
      {
        headers: {
          "user-agent": req.headers["user-agent"] || "",
          "x-forwarded-for": String(forwardedFor).split(",")[0].trim(),
        },
        timeout: 2000,
      },
      (trackRes) => {
        trackRes.resume();
        trackRes.on("end", resolve);
      },
    );

    trackReq.on("error", resolve);
    trackReq.on("timeout", () => {
      trackReq.destroy();
      resolve();
    });
  });

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");

    if (url.pathname === "/") {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tai HOCA APK</title>
  <style>
    body { font-family: Arial, sans-serif; background:#111827; color:white; margin:0; padding:32px 18px; }
    main { max-width: 520px; margin: 0 auto; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    p { color:#cbd5e1; line-height:1.5; }
    a { display:block; text-align:center; margin:14px 0; padding:16px; border-radius:12px; text-decoration:none; font-weight:700; }
    .apk { background:#f97316; color:white; }
    .zip { background:#334155; color:white; border:1px solid #64748b; }
    small { color:#94a3b8; display:block; margin-top:18px; line-height:1.5; }
  </style>
</head>
<body>
  <main>
    <h1>Tai HOCA ban moi nhat</h1>
    <p>Android cua ban co the chan file APK tai truc tiep. Hay tai ban ZIP, giai nen, sau do mo HOCA.apk de cai dat.</p>
    <a class="apk" href="/HOCA.zip" download>Tai HOCA.zip</a>
    <a class="zip" href="/HOCA.apk" download>Tai APK truc tiep</a>
    <small>Mo ung dung Tep/Files, vao Downloads, giai nen HOCA.zip, mo HOCA.apk va cho phep cai dat ung dung khong ro nguon goc neu Android hoi.</small>
  </main>
</body>
</html>`);
      return;
    }

    const file = files[url.pathname];
    if (!file) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    fs.stat(file.path, async (err, stat) => {
      if (err) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }

      if (req.method !== "HEAD") {
        await trackDownload(
          req,
          url.pathname === "/HOCA.zip" ? "cloudflare-zip" : "cloudflare-apk",
        );
      }

      res.writeHead(200, {
        "Content-Type": file.type,
        "Content-Length": stat.size,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      });

      if (req.method === "HEAD") {
        res.end();
        return;
      }

      fs.createReadStream(file.path).pipe(res);
    });
  })
  .listen(8080, "0.0.0.0");
