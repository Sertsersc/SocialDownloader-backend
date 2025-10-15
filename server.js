import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔥 Genel Downloader Endpoint
app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    // Platform belirleme
    if (url.includes("tiktok.com")) return await handleTikTok(url, res);
    if (url.includes("instagram.com")) return await handleInstagram(url, res);
    if (url.includes("facebook.com") || url.includes("fb.watch")) return await handleFacebook(url, res);
    if (url.includes("youtube.com") || url.includes("youtu.be")) return await handleYouTube(url, res);

    return res.status(400).json({ error: "Unsupported platform" });
  } catch (err) {
    console.error("General Downloader Error:", err.message);
    res.status(500).json({ error: "Unexpected error", details: err.message });
  }
});


// 🌀 TikTok Handler
async function handleTikTok(url, res) {
  try {
    const api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);
    res.json({
      platform: "tiktok",
      title: data.title || "TikTok Video",
      thumbnail: data.cover,
      media: [
        { quality: "HD", url: data.video },
        { quality: "Music", url: data.music },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "TikTok download failed", details: err.message });
  }
}


// 🌀 Instagram Handler
async function handleInstagram(url, res) {
  try {
    const api = `https://igram.world/api/instagram?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(api);
    res.json({
      platform: "instagram",
      title: data?.title || "Instagram Media",
      thumbnail: data?.thumbnail || null,
      media: data?.media?.map((m) => ({
        quality: m.quality || "default",
        url: m.url,
      })) || [],
    });
  } catch (err) {
    res.status(500).json({ error: "Instagram download failed", details: err.message });
  }
}


// 🌀 Facebook Handler (fdown.net)
async function handleFacebook(url, res) {
  try {
    const response = await axios.post(
      "https://fdown.net/download.php",
      new URLSearchParams({ URLz: url }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const $ = cheerio.load(response.data);
    const links = [];

    $("a.btn.btn-download").each((_, el) => {
      const href = $(el).attr("href");
      const quality = $(el).text().trim();
      if (href) links.push({ quality, url: href });
    });

    if (!links.length) throw new Error("No Facebook links found");

    res.json({
      platform: "facebook",
      title: "Facebook Video",
      thumbnail: null,
      media: links,
    });
  } catch (err) {
    res.status(500).json({ error: "Facebook download failed", details: err.message });
  }
}


// 🌀 YouTube Handler (3 Katmanlı)
async function handleYouTube(url, res) {
  try {
    const APIs = [
      `https://api.vevioz.com/api/button/mp3/${encodeURIComponent(url)}`,
      `https://api.vevioz.com/api/button/mp4/${encodeURIComponent(url)}`,
      `https://yt-download.org/api/widgetv2?url=${encodeURIComponent(url)}`,
    ];

    let data = null;
    for (const api of APIs) {
      try {
        const html = await axios.get(api, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000,
        });
        if (html.status === 200 && html.data.includes("href")) {
          data = html.data;
          break;
        }
      } catch {}
    }

    if (!data) throw new Error("No valid YouTube API response");

    const $ = cheerio.load(data);
    const links = [];

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      const text = $(el).text().trim();
      if (href && href.includes("https")) links.push({ quality: text, url: href });
    });

    if (!links.length) throw new Error("No YouTube links found");

    res.json({
      platform: "youtube",
      title: "YouTube Video",
      thumbnail: null,
      media: links,
    });
  } catch (err) {
    res.status(500).json({ error: "YouTube download failed", details: err.message });
  }
}

app.listen(PORT, () => console.log(`✅ Social Media Downloader API v3 running on port ${PORT}`));
