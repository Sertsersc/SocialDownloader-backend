import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "178dd1391dmsh3c94f458f1e4554p143e7ajsna491fd1338ec";

// YouTube için progress takibi
const youtubeProgress = {};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Ana sayfa
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Sosyal Medya İndirici API",
    version: "3.0",
    endpoints: {
      download: "POST /api/download",
      youtube: "POST /api/youtube",
      instagram: "POST /api/instagram",
      tiktok: "POST /api/tiktok",
      facebook: "POST /api/facebook",
      progress: "GET /api/progress/:videoId"
    },
    status: "Çalışıyor ✅"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", uptime: Math.floor(process.uptime()) });
});

// YouTube özel endpoint
app.post("/api/youtube", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: "URL gerekli" });

    // Video ID çıkar
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("shorts/")) {
      videoId = url.split("shorts/")[1].split("?")[0];
    } else {
      return res.json({ success: false, message: "Geçersiz YouTube URL" });
    }

    console.log("YouTube Video ID:", videoId);

    // Progress kontrolü
    if (youtubeProgress[videoId]?.ready) {
      return res.json({
        success: true,
        downloadUrl: youtubeProgress[videoId].downloadUrl,
        title: youtubeProgress[videoId].title,
        thumbnail: youtubeProgress[videoId].thumbnail,
        videoId: videoId
      });
    }

    // Hemen dene
    const options = {
      method: "GET",
      url: "https://youtube-mp4-mp3-downloader.p.rapidapi.com/api/v1/download",
      params: { 
        id: videoId, 
        format: "720", 
        audioQuality: "128"
      },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "youtube-mp4-mp3-downloader.p.rapidapi.com"
      },
      timeout: 20000
    };

    const response = await axios.request(options);
    const downloadUrl = response.data?.downloadUrl || response.data?.file;

    if (downloadUrl) {
      youtubeProgress[videoId] = {
        ready: true,
        downloadUrl: downloadUrl,
        title: response.data?.title || "YouTube Video",
        thumbnail: response.data?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      };

      return res.json({
        success: true,
        downloadUrl: downloadUrl,
        title: response.data?.title || "YouTube Video",
        thumbnail: response.data?.thumbnail,
        videoId: videoId
      });
    }

    // Başarısız - async başlat
    if (!youtubeProgress[videoId]) {
      youtubeProgress[videoId] = { ready: false, attempts: 0 };
      processYouTubeVideo(videoId);
    }

    return res.json({
      success: false,
      message: "Video işleniyor. Lütfen 10 saniye sonra tekrar deneyin.",
      videoId: videoId,
      progressUrl: `/api/progress/${videoId}`
    });

  } catch (error) {
    console.error("YouTube Error:", error.message);
    return res.json({
      success: false,
      message: "YouTube hatası: " + error.message
    });
  }
});

// Instagram endpoint
app.post("/api/instagram", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("instagram.com")) return res.json({ success: false, message: "Geçersiz Instagram URL" });

    console.log("Instagram URL:", url);

    const options = {
      method: "GET",
      url: "https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert",
      params: { url: url },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com"
      },
      timeout: 20000
    };

    const response = await axios.request(options);
    console.log("Instagram Response:", JSON.stringify(response.data));

    const media = response.data?.media?.[0];
    if (media) {
      return res.json({
        success: true,
        downloadUrl: media.url,
        thumbnail: media.thumbnail,
        title: media.title || "Instagram Media"
      });
    }

    // Alternatif yapı
    if (response.data?.url) {
      return res.json({
        success: true,
        downloadUrl: response.data.url,
        thumbnail: response.data.thumbnail,
        title: "Instagram Media"
      });
    }

    return res.json({
      success: false,
      message: "Video bulunamadı",
      debug: response.data
    });

  } catch (error) {
    console.error("Instagram Error:", error.response?.data || error.message);
    return res.json({
      success: false,
      message: "Instagram hatası: " + error.message
    });
  }
});

// TikTok endpoint
app.post("/api/tiktok", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("tiktok.com")) return res.json({ success: false, message: "Geçersiz TikTok URL" });

    console.log("TikTok URL:", url);

    // Fallback API kullan
    const fallbackUrl = `https://robotilab.xyz/download-api/tiktok/download?videoUrl=${encodeURIComponent(url)}`;
    const response = await axios.get(fallbackUrl, { timeout: 20000 });

    console.log("TikTok Response:", JSON.stringify(response.data));

    if (response.data?.downloadUrl) {
      return res.json({
        success: true,
        downloadUrl: response.data.downloadUrl,
        thumbnail: response.data.cover,
        title: response.data.description || "TikTok Video"
      });
    }

    return res.json({
      success: false,
      message: "Video bulunamadı",
      debug: response.data
    });

  } catch (error) {
    console.error("TikTok Error:", error.message);
    return res.json({
      success: false,
      message: "TikTok hatası: " + error.message
    });
  }
});

// Facebook endpoint
app.post("/api/facebook", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: "URL gerekli" });
    if (!url.includes("facebook.com") && !url.includes("fb.watch")) {
      return res.json({ success: false, message: "Geçersiz Facebook URL" });
    }

    console.log("Facebook URL:", url);

    const options = {
      method: "POST",
      url: "https://fdown1.p.rapidapi.com/download",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "fdown1.p.rapidapi.com",
        "Content-Type": "application/json"
      },
      data: { url: url },
      timeout: 20000
    };

    const response = await axios.request(options);
    console.log("Facebook Response:", JSON.stringify(response.data));

    const hdUrl = response.data?.data?.download?.hd?.url;
    const sdUrl = response.data?.data?.download?.sd?.url;
    const downloadUrl = hdUrl || sdUrl;

    if (downloadUrl) {
      return res.json({
        success: true,
        downloadUrl: downloadUrl,
        thumbnail: response.data?.data?.video?.thumbnail_url,
        title: response.data?.data?.video?.title || "Facebook Video"
      });
    }

    return res.json({
      success: false,
      message: "Video bulunamadı",
      debug: response.data
    });

  } catch (error) {
    console.error("Facebook Error:", error.response?.data || error.message);
    return res.json({
      success: false,
      message: "Facebook hatası: " + error.message
    });
  }
});

// Genel download endpoint (backward compatibility)
app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ success: false, message: "URL gerekli" });

  // Platform'a göre yönlendir
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    req.url = "/api/youtube";
    return app._router.handle(req, res);
  } else if (url.includes("instagram.com")) {
    req.url = "/api/instagram";
    return app._router.handle(req, res);
  } else if (url.includes("tiktok.com")) {
    req.url = "/api/tiktok";
    return app._router.handle(req, res);
  } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
    req.url = "/api/facebook";
    return app._router.handle(req, res);
  }

  return res.json({ success: false, message: "Desteklenmeyen platform" });
});

// Progress endpoint
app.get("/api/progress/:videoId", (req, res) => {
  const { videoId } = req.params;
  const progress = youtubeProgress[videoId];

  if (!progress) {
    return res.json({ 
      success: false, 
      message: "Video bulunamadı veya işlem başlatılmamış" 
    });
  }

  res.json({
    success: true,
    ready: progress.ready,
    attempts: progress.attempts || 0,
    downloadUrl: progress.downloadUrl || null,
    title: progress.title || null
  });
});

// YouTube async işleme
async function processYouTubeVideo(videoId) {
  const options = {
    method: "GET",
    url: "https://youtube-mp4-mp3-downloader.p.rapidapi.com/api/v1/download",
    params: { id: videoId, format: "720", audioQuality: "128" },
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "youtube-mp4-mp3-downloader.p.rapidapi.com"
    },
    timeout: 15000
  };

  let progress = youtubeProgress[videoId];
  for (let attempt = 1; attempt <= 5; attempt++) {
    progress.attempts = attempt;
    console.log(`YouTube ${videoId} - Attempt ${attempt}`);

    try {
      const response = await axios.request(options);
      const downloadUrl = response.data?.downloadUrl || response.data?.file;

      if (downloadUrl) {
        progress.ready = true;
        progress.downloadUrl = downloadUrl;
        progress.title = response.data?.title || "YouTube Video";
        progress.thumbnail = response.data?.thumbnail;
        console.log(`YouTube ${videoId} - SUCCESS!`);
        break;
      }
    } catch (err) {
      console.log(`YouTube ${videoId} - Attempt ${attempt} failed: ${err.message}`);
    }

    if (attempt < 5) await delay(5000);
  }
}

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: "Sunucu hatası: " + err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint bulunamadı: " + req.path
  });
});

// Server başlat
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Ready!`);
});

export default app;