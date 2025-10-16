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
      const response = await axios.request(options);
      const mediaUrl = response.data?.url?.[0]?.url || null;
      return { downloadUrl: mediaUrl };

    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      const options = {
        method: "GET",
        url: "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
        params: { videoId, urlAccess: "normal", videos: "auto", audios: "auto" },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"
        }
      };
      const response = await axios.request(options);
      const downloadUrl = response.data?.videos?.[0]?.url || null;
      return { downloadUrl };

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
      const response = await axios.request(options);
      const downloadUrl = response.data?.url || null;
      return { downloadUrl };

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
      const response = await axios.request(options);
      const downloadUrl = response.data?.video?.download || null;
      return { downloadUrl };
    }

    throw new Error("Platform desteklenmiyor");
  } catch (err) {
    console.error(err.message);
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

    res.json({ success: true, downloadUrl: result.downloadUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
