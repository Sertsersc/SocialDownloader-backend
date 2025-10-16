import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RAPIDAPI_KEY = "178dd1391dmsh3c94f458f1e4554p143e7ajsna491fd1338ec";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// YouTube video progress tracker (basit memory store)
const youtubeProgress = {}; 

// YouTube progress sorgulama
async function checkYouTubeProgress(videoId) {
  const options = {
    method: 'GET',
    url: 'https://youtube-mp4-mp3-downloader.p.rapidapi.com/api/v1/progress',
    params: { id: videoId },
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': 'youtube-mp4-mp3-downloader.p.rapidapi.com'
    }
  };

  try {
    const res = await axios.request(options);
    youtubeProgress[videoId] = res.data;
    return res.data;
  } catch (err) {
    console.error("YouTube progress error:", err.message);
    return { ready: false };
  }
}

// Video info fetch
async function fetchRapidAPI(url) {
  let response;
  let downloadUrl = null;
  let thumbnail = null;
  let duration = null;
  let title = null;

  try {
    // Instagram
	if (url.includes("instagram.com")) {
      const options = {
        method: "GET",
        url: "https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert",
        params: { url },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com"
        }
      };
      response = await axios.request(options);
      console.log("Instagram API response:", response.data);

      const media = response.data?.media?.[0];
      if (media) {
        downloadUrl = media.url || null;
        thumbnail = media.thumbnail || null;
        duration = media.duration || null;
      }

    // Facebook
        } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
      const options = {
        method: "POST",
        url: "https://fdown1.p.rapidapi.com/download",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "fdown1.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        data: { url }
      };
      response = await axios.request(options);
      console.log("Facebook API response:", response.data);

      // HD varsa onu al, yoksa SD
      downloadUrl = response.data?.data?.download?.hd?.url 
                    || response.data?.data?.download?.sd?.url 
                    || null;
      thumbnail = response.data?.data?.video?.thumbnail_url || null;
      duration = response.data?.data?.video?.duration_ms || null;

    // TikTok
    } else if (url.includes("tiktok.com")) {
      const fallbackUrl = `https://robotilab.xyz/download-api/tiktok/download?videoUrl=${encodeURIComponent(url)}`;
      try {
        response = await axios.get(fallbackUrl);
        downloadUrl = response.data?.downloadUrl || null;
        thumbnail = response.data?.cover || null;
        duration = response.data?.duration || null;
        title = response.data?.description || null;
      } catch (err) {
        console.log("TikTok fallback error:", err.message);
      }
    }

    return { downloadUrl, title, thumbnail, duration };
  } catch (err) {
    console.error("RapidAPI error:", err.message);
    return { downloadUrl: null, error: err.message };
  }
}

// -------------------- ENDPOINTLER --------------------

// YouTube progress endpoint
app.get("/api/progress", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, message: "Video ID gerekli" });

  const progress = await checkYouTubeProgress(id);
  res.json({ success: true, progress });
});

// Download endpoint
app.post("/api/download", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: "URL gerekli" });

  // YouTube kontrolü
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
    const progress = youtubeProgress[videoId] || await checkYouTubeProgress(videoId);

    if (!progress.ready) {
      return res.status(202).json({
        success: false,
        message: "YouTube video işleniyor. Progress endpoint’inden kontrol et.",
        progress: progress
      });
    }
  }

  const result = await fetchRapidAPI(url);
  if (!result.downloadUrl) return res.status(500).json({ success: false, message: result.error || "Download alınamadı" });

  res.json({ success: true, ...result });
});

// -------------------- SERVER --------------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
