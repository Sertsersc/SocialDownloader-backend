// ========================================
// server.js - Social Media Downloader (Render Optimized)
// ========================================

import express from "express";
import cors from "cors";
import axios from "axios";
import https from "https";

// SSL doğrulamasını bypass et (Render HTTPS hataları için)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Axios Global Ayarlar
// ========================================
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 20000;
axios.defaults.baseURL = "https://";
axios.defaults.validateStatus = () => true;
axios.defaults.headers.common["User-Agent"] =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

// ========================================
// Express Middleware
// ========================================
app.enable("trust proxy");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// Yardımcı Fonksiyonlar
// ========================================
async function resolveRedirect(url) {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return response.request?.res?.responseUrl || url;
  } catch {
    return url;
  }
}

function normalizeInstagramUrl(url) {
  if (!url.startsWith("https://")) url = url.replace("http://", "https://");
  if (url.includes("?")) url = url.split("?")[0];
  if (!url.endsWith("/")) url += "/";
  return url;
}

async function normalizeTikTokUrl(url) {
  if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
    url = await resolveRedirect(url);
  }
  if (url.includes("?")) url = url.split("?")[0];
  return url;
}

function normalizeFacebookUrl(url) {
  if (!url.startsWith("https://")) {
    url = "https://" + url.replace(/^http:\/\//, "");
  }
  if (url.includes("?")) url = url.split("?")[0];
  return url;
}

// ========================================
// Ana Sayfa & Health Check
// ========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🌐 Social Media Downloader API (Render Optimized)",
    version: "2.3",
    status: "Running ✅",
    endpoints: {
      youtube: "POST /api/youtube",
      instagram: "POST /api/instagram",
      tiktok: "POST /api/tiktok",
      facebook: "POST /api/facebook",
    },
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: process.uptime() });
});

// ========================================
// YouTube Downloader
// ========================================
app.post("/api/youtube", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("youtube.com") && !url.includes("youtu.be"))
      return res.json({ success: false, message: "Geçersiz YouTube URL" });

    let videoId = "";
    if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("watch?v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("/shorts/")) videoId = url.split("shorts/")[1].split("?")[0];

    const fallback = {
      success: true,
      title: "YouTube Video",
      downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };

    if (!process.env.RAPIDAPI_KEY) return res.json(fallback);

    const options = {
      method: "GET",
      url: "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
      params: { videoId },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "youtube-media-downloader.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    const video = response.data?.videos?.items?.[0];

    res.json(
      video
        ? {
            success: true,
            downloadUrl: video.url,
            title: response.data.title,
            thumbnail: response.data.thumbnail,
          }
        : fallback
    );
  } catch (error) {
    console.error("YouTube Error:", error.message);
    res.json({ success: false, message: "YouTube hata: " + error.message });
  }
});

// ========================================
// Instagram Downloader
// ========================================
app.all("/api/instagram", async (req, res) => {
  try {
    let url = req.method === "GET" ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("instagram.com")) return res.json({ success: false, message: "Geçersiz Instagram URL" });

    url = normalizeInstagramUrl(url);
    console.log("Normalized Instagram URL:", url);

    if (!process.env.RAPIDAPI_KEY)
      return res.json({ success: false, message: "Instagram için RapidAPI key gerekli" });

    const response = await axios.get(
      "https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert",
      {
        params: { url },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com",
        },
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Instagram Error:", error.message);
    res.json({ success: false, message: "Instagram hata: " + error.message });
  }
});

// ========================================
// TikTok Downloader (TikWM Proxy - 421 FIX)
// ========================================
app.all("/api/tiktok", async (req, res) => {
  try {
    let url = req.method === "GET" ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("tiktok.com")) return res.json({ success: false, message: "Geçersiz TikTok URL" });

    url = await normalizeTikTokUrl(url);
    const response = await axios.get("https://www.tikwm.com/api/", {
      params: { url },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Referer: "https://www.tikwm.com/",
      },
    });

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("TikTok Error:", error.message);
    res.json({ success: false, message: "TikTok hata: " + error.message });
  }
});

// ========================================
// Facebook Downloader (502 FIX)
// ========================================
app.all("/api/facebook", async (req, res) => {
  try {
    let url = req.method === "GET" ? req.query.url : req.body.url;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    url = normalizeFacebookUrl(url);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    console.error("Facebook Fetch Error:", err.message);
    res.status(502).json({ error: "Facebook request failed" });
  }
});

// ========================================
// 404 & Error Handling
// ========================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint bulunamadı" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ success: false, message: "Sunucu hatası: " + err.message });
});

// ========================================
// Server Start
// ========================================
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down...");
  server.close(() => process.exit(0));
});
