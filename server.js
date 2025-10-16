import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const RAPIDAPI_KEY = "178dd1391dmsh3c94f458f1e4554p143e7ajsna491fd1332ec";

// Genel fetch fonksiyonu
async function fetchFromRapidAPI(platform, urlOrId) {
  let options;

  switch (platform.toLowerCase()) {
    case "instagram":
      options = {
        method: "GET",
        url: "https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert",
        params: { url: urlOrId },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com"
        }
      };
      break;

    case "youtube":
      options = {
        method: "GET",
        url: "https://youtube-media-downloader.p.rapidapi.com/v2/video/details",
        params: {
          videoId: urlOrId,
          urlAccess: "normal",
          videos: "auto",
          audios: "auto"
        },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-media-downloader.p.rapidapi.com"
        }
      };
      break;

    case "facebook":
      options = {
        method: "POST",
        url: "https://fdown1.p.rapidapi.com/download",
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "fdown1.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        data: { url: urlOrId }
      };
      break;

    case "tiktok":
      options = {
        method: "GET",
        url: "https://tiktok-video-downloader-api.p.rapidapi.com/media",
        params: { videoUrl: urlOrId },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "tiktok-video-downloader-api.p.rapidapi.com"
        }
      };
      break;

    default:
      throw new Error("Desteklenmeyen platform: " + platform);
  }

  const response = await axios.request(options);
  return response.data;
}

// Endpoint
app.post("/api/download", async (req, res) => {
  const { platform, urlOrId } = req.body;
  if (!platform || !urlOrId)
    return res.status(400).json({ error: "Platform ve urlOrId gerekli" });

  try {
    const data = await fetchFromRapidAPI(platform, urlOrId);
    res.json({ platform, data });
  } catch (err) {
    console.error("API Hatası:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
