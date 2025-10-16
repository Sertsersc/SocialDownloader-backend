import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// RapidAPI key
const RAPIDAPI_KEY = "178dd1391dmsh3c94f458f1e4554p143e7ajsna491fd1332ec";

// Helper: RapidAPI çağrısı
async function fetchRapidAPI(url) {
  try {
    let response;
    let downloadUrl = null;
    let thumbnail = null;
    let duration = null;

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

    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      const options = {
        method: "GET",
        url: `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${videoId}`,
        params: { quality: "247" }, // HD seçimi
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-video-fast-downloader-24-7.p.rapidapi.com"
        }
      };

      response = await axios.request(options);
      console.log("YouTube API response:", response.data);

      downloadUrl = response.data?.url || null;
      thumbnail = response.data?.thumbnail || null;
      duration = response.data?.duration || null;

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

      downloadUrl = response.data?.data?.download?.hd?.url 
                    || response.data?.data?.download?.sd?.url 
                    || null;
      thumbnail = response.data?.data?.video?.thumbnail_url || null;
      duration = response.data?.data?.video?.duration_ms || null;

    } else if (url.includes("tiktok.com")) {
      const options = {
        method: "GET",
        url: "https://tiktok-video-downloader-api.p.rapidapi.com/media",
        params: { videoUrl: url },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "tiktok-video-downloader-api.p.rapidapi.com"
        }
      };
      response = await axios.request(options);
      console.log("TikTok API response:", response.data);

      downloadUrl = response.data?.video?.download || response.data?.downloadUrl || null;
      thumbnail = response.data?.video?.thumbnail || null;
      duration = response.data?.video?.duration || null;

    } else {
      throw new Error("Platform desteklenmiyor");
    }

    if (!downloadUrl) {
      throw new Error("Download URL alınamadı");
    }

    return { downloadUrl, thumbnail, duration };

  } catch (err) {
    console.error("RapidAPI error:", err.message);
    return { downloadUrl: null, error: err.message };
  }
}

// Tek endpoint
app.post("/api/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL gerekli" });

    const result = await fetchRapidAPI(url);
    if (!result.downloadUrl) {
      return res.status(500).json({ success: false, message: result.error || "Download alınamadı" });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
