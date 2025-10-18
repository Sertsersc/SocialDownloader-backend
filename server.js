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

// YouTube özel endpoint - SYNC (Bekleyip sonuç döner)
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

    // Cache'de varsa hemen dön
    if (youtubeProgress[videoId]?.ready) {
      return res.json({
        success: true,
        downloadUrl: youtubeProgress[videoId].downloadUrl,
        title: youtubeProgress[videoId].title,
        thumbnail: youtubeProgress[videoId].thumbnail,
        videoId: videoId
      });
    }

    // API 1: youtube-mp4-mp3-downloader
    try {
      console.log("Deneme 1: youtube-mp4-mp3-downloader");
      const options1 = {
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
        timeout: 25000
      };

      const response1 = await axios.request(options1);
      console.log("API 1 Response:", JSON.stringify(response1.data));
      
      const downloadUrl = response1.data?.downloadUrl || response1.data?.file;
      if (downloadUrl) {
        const result = {
          ready: true,
          downloadUrl: downloadUrl,
          title: response1.data?.title || "YouTube Video",
          thumbnail: response1.data?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
        
        youtubeProgress[videoId] = result;
        
        return res.json({
          success: true,
          downloadUrl: result.downloadUrl,
          title: result.title,
          thumbnail: result.thumbnail,
          videoId: videoId
        });
      }
    } catch (err1) {
      console.log("API 1 Failed:", err1.message);
    }

    // API 2: Alternatif - youtube-media-downloader
    try {
      console.log("Deneme 2: youtube-media-downloader");
      const options2 = {
        method: "GET",
        url: "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
        params: { videoId: videoId },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"
        },
        timeout: 20000
      };

      const response2 = await axios.request(options2);
      console.log("API 2 Response:", JSON.stringify(response2.data));

      if (response2.data?.videos?.items?.[0]) {
        const video = response2.data.videos.items[0];
        const result = {
          ready: true,
          downloadUrl: video.url,
          title: response2.data.title || "YouTube Video",
          thumbnail: response2.data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };

        youtubeProgress[videoId] = result;

        return res.json({
          success: true,
          downloadUrl: result.downloadUrl,
          title: result.title,
          thumbnail: result.thumbnail,
          videoId: videoId
        });
      }
    } catch (err2) {
      console.log("API 2 Failed:", err2.message);
    }

    // API 3: Basit link dön (en azından videoyu gösterir)
    return res.json({
      success: true,
      downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      videoId: videoId,
      message: "Direkt indirme linki alınamadı, YouTube sayfası açılacak"
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

// TikTok Downloader - YENİ API
app.post('/api/tiktok', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.json({ success: false, message: 'URL gerekli' });
    }

    if (!url.includes('tiktok.com')) {
      return res.json({ success: false, message: 'Geçersiz TikTok URL' });
    }

    console.log('TikTok URL:', url);

    // Snap Video API kullan
    const options = {
      method: 'POST',
      url: 'https://snap-video3.p.rapidapi.com/download',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': 'snap-video3.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: new URLSearchParams({
        url: url
      }),
      timeout: 20000
    };

    const response = await axios.request(options);
    console.log('TikTok Response:', JSON.stringify(response.data));

    // Response yapısına göre parse et
    if (response.data?.data) {
      const videoData = response.data.data;
      return res.json({
        success: true,
        downloadUrl: videoData.url || videoData.downloadUrl || videoData.video_url,
        thumbnail: videoData.thumbnail || videoData.cover,
        title: videoData.title || videoData.description || 'TikTok Video'
      });
    }

    // Alternatif yapı
    if (response.data?.url || response.data?.downloadUrl) {
      return res.json({
        success: true,
        downloadUrl: response.data.url || response.data.downloadUrl,
        thumbnail: response.data.thumbnail,
        title: response.data.title || 'TikTok Video'
      });
    }

    return res.json({
      success: false,
      message: 'Video bulunamadı',
      debug: response.data
    });

  } catch (error) {
    console.error('TikTok Error:', error.response?.data || error.message);
    return res.json({
      success: false,
      message: 'TikTok hatası: ' + error.message
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