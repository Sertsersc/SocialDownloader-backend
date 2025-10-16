import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RAPIDAPI_KEY = "178dd1391dmsh3c94f458f1e4554p143e7ajsna491fd1338ec";

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRapidAPI(url) {
  try {
    let response;
    let downloadUrl = null;
    let thumbnail = null;
    let duration = null;
    let title = null;

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
    params: { quality: "247" },
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "youtube-video-fast-downloader-24-7.p.rapidapi.com"
    },
    timeout: 15000 // 15 saniye
  };

  for (let i = 0; i < 5; i++) {
    try {
      response = await axios.request(options);
      downloadUrl = response.data?.file || response.data?.reserved_file || null;
      title = response.data?.title || null;
      thumbnail = response.data?.thumbnail || null;
      duration = response.data?.duration || null;

      console.log(`YouTube attempt ${i+1}:`, downloadUrl ? "SUCCESS" : "WAITING FILE");

      if (downloadUrl) break;
    } catch (err) {
      console.log(`YouTube attempt ${i+1} failed: ${err.message}`);
    }
    await delay(10000); // 10 saniye bekle
  }
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
      downloadUrl = response.data?.data?.download?.hd?.url 
                    || response.data?.data?.download?.sd?.url 
                    || null;
      thumbnail = response.data?.data?.video?.thumbnail_url || null;
      duration = response.data?.data?.video?.duration_ms || null;

    // TikTok
    } else if (url.includes("tiktok.com")) {
      const fallbackUrl = `https://robotilab.xyz/download-api/tiktok/download?videoUrl=${encodeURIComponent(url)}`;
      response = await axios.get(fallbackUrl);
      downloadUrl = response.data?.downloadUrl || null;
      thumbnail = response.data?.cover || null;
      duration = response.data?.duration || null;
      title = response.data?.description || null;
    }

    if (!downloadUrl) throw new Error("Download URL alınamadı");
    return { downloadUrl, title, thumbnail, duration };

  } catch (err) {
    console.error("RapidAPI error:", err.message);
    return { downloadUrl: null, error: err.message };
  }
}

app.post("/api/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL gerekli" });

    const result = await fetchRapidAPI(url);
    if (!result.downloadUrl) return res.status(500).json({ success: false, message: result.error || "Download alınamadı" });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
