import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

/**
 * Ortak axios instance
 * Cloudflare ve SSL hatalarını önlemek için güvenli proxy ayarları
 */
const http = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json, text/html, */*",
  },
  validateStatus: () => true,
});

/**
 * ✅ TikTok Downloader
 */
app.post("/api/tiktok", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "TikTok URL required" });

    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://api.tiklydown.eu.org/api/download?url=${url}`
    )}`;

    const { data } = await http.get(proxyUrl);
    const json = JSON.parse(data.contents);

    res.json({
      platform: "tiktok",
      video: json.video,
      music: json.music,
      thumbnail: json.cover,
    });
  } catch (err) {
    res.status(500).json({ error: "TikTok download failed", details: err.message });
  }
});

/**
 * ✅ Instagram Downloader
 */
app.post("/api/instagram", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Instagram URL required" });

    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://igram.world/api/instagram?url=${url}`
    )}`;

    const { data } = await http.get(proxyUrl);
    const json = JSON.parse(data.contents);

    res.json({
      platform: "instagram",
      media: json?.media || [],
      author: json?.author || "unknown",
    });
  } catch (err) {
    res.status(500).json({ error: "Instagram download failed", details: err.message });
  }
});

/**
 * ✅ Facebook Downloader (fdown.net)
 */
app.post("/api/facebook", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Facebook URL required" });

    const proxyUrl = "https://api.allorigins.win/raw?url=" +
      encodeURIComponent("https://fdown.net/download.php");

    const response = await http.post(
      proxyUrl,
      new URLSearchParams({ URLz: url }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const $ = cheerio.load(response.data);
    const links = [];

    $("a.btn.btn-download").each((_, el) => {
      const href = $(el).attr("href");
      const quality = $(el).text().trim();
      if (href) links.push({ quality, url: href });
    });

    if (!links.length)
      throw new Error("No downloadable links found on fdown.net");

    res.json({ platform: "facebook", media: links });
  } catch (err) {
    res.status(500).json({ error: "Facebook download failed", details: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
