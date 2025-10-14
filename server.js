import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// TikTok Downloader (TiklyDown API)
app.post("/api/tiktok", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "TikTok URL required" });

    const api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);
    res.json({
      platform: "tiktok",
      video: data.video || null,
      music: data.music || null,
      thumbnail: data.cover || null,
    });
  } catch (err) {
    res.status(500).json({ error: "TikTok download failed", details: err.message });
  }
});

// Instagram Downloader (igram.world)
app.post("/api/instagram", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Instagram URL required" });

    const api = `https://igram.world/api/instagram?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);
    res.json({
      platform: "instagram",
      media: data?.media || [],
      author: data?.author || "unknown",
    });
  } catch (err) {
    res.status(500).json({ error: "Instagram download failed", details: err.message });
  }
});

import * as cheerio from "cheerio";

app.post("/api/facebook", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Facebook URL required" });

    const response = await axios.post(
      "https://fdown.net/download.php",
      new URLSearchParams({ URLz: url }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    const $ = cheerio.load(response.data);
    const links = [];

    $("a.btn.btn-download").each((_, el) => {
      const href = $(el).attr("href");
      const quality = $(el).text().trim();
      if (href) links.push({ quality, url: href });
    });

    if (links.length === 0) {
      throw new Error("fdown.net response did not contain any media links");
    }

    res.json({
      platform: "facebook",
      media: links
    });

  } catch (err) {
    console.error("fdown.net Facebook Downloader Error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    res.status(500).json({
      error: "Facebook download failed",
      details: err.message
    });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
