import express from "express";
import axios from "axios";
import https from "https";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ortak axios instance
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const http = axios.create({
  timeout: 20000,
  httpsAgent,
  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  validateStatus: () => true,
});

// Instagram handler
async function instagramHandler(url) {
  const payload = {
    url,
    ts: Date.now(),
    _ts: Date.now() - 1000000,
    _tsc: 0,
    _s: "5abd8486beffde0d818244b0d2c75e0de07df2eb92b5bb2cae847eedb33ceec4"
  };
  const r = await http.post("https://sssinstagram.com/api/convert", payload, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "Origin": "https://sssinstagram.com",
      "Referer": "https://sssinstagram.com/",
    }
  });
  return r.data;
}

// Facebook via fdownloader
async function facebookFdownHandler(url) {
  const form = new URLSearchParams({
    url
  }).toString();
  const r = await http.post("https://v3.fdownloader.net/api/ajaxSearch", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Origin": "https://fdownloader.net",
      "Referer": "https://fdownloader.net/"
    }
  });
  return r.data;
}

// Facebook via fsave
async function facebookFsaveHandler(url) {
  const form = new URLSearchParams({
    url
  }).toString();
  const r = await http.post("https://fsave.io/action.php?lang=en", form, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://fsave.io",
      "Referer": "https://fsave.io/"
    }
  });
  return r.data;
}

// TikTok handler
async function tiktokHandler(url) {
  const r = await http.post("https://savetik.app/requests", { url }, {
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://savetik.app",
      "Referer": "https://savetik.app/"
    }
  });
  return r.data;
}

// YouTube handler
async function youtubeHandler(url) {
  const payload = { url };
  const r = await http.post("https://api.ssyoutube.com/api/convert", payload, {
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://ssyoutube.com",
      "Referer": "https://ssyoutube.com/"
    }
  });
  return r.data;
}

// Genel endpoint
app.post("/api/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let result;

    if (url.includes("instagram.com")) {
      result = await instagramHandler(url);
      // parse result: result.url[0].url gibi
      const mediaUrl = result.url?.[0]?.url;
      return res.json({ platform: "instagram", mediaUrl, raw: result });
    }
    if (url.includes("facebook.com") || url.includes("fb.watch")) {
      // deneyerek biriyle çalış
      try {
        const d = await facebookFdownHandler(url);
        return res.json({ platform: "facebook", raw: d });
      } catch (e) {
        const d2 = await facebookFsaveHandler(url);
        return res.json({ platform: "facebook", raw: d2 });
      }
    }
    if (url.includes("tiktok.com")) {
      result = await tiktokHandler(url);
      return res.json({ platform: "tiktok", raw: result });
    }
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      result = await youtubeHandler(url);
      return res.json({ platform: "youtube", raw: result });
    }

    return res.status(400).json({ error: "Platform not supported" });
  } catch (err) {
    console.error("Download API Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Proxy stream endpoint (CORS / mixed-content çözümü)
app.get("/proxy", async (req, res) => {
  try {
    const { target } = req.query;
    if (!target) return res.status(400).send("Missing target");

    const response = await http.get(target, { responseType: "stream" });
    const ct = response.headers["content-type"];
    if (ct) res.setHeader("Content-Type", ct);
    response.data.pipe(res);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
