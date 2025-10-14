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

app.post("/api/facebook", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Facebook URL required" });

    const api = `https://snapinsta.app/api/facebook?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);

    if (!data || !Array.isArray(data.links)) {
      throw new Error("SnapInsta response invalid or missing media links");
    }

    res.json({
      platform: "facebook",
      media: data.links,
      title: data.title || "unknown",
    });

  } catch (err) {
    console.error("Facebook Downloader Error:", {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    });

    res.status(500).json({
      error: "Facebook download failed",
      details: err.response?.data?.error || err.message
    });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
