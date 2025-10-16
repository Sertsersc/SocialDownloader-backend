async function fetchRapidAPI(url) {
  try {
    let response;
    let downloadUrl = null;
    let thumbnail = null;
    let duration = null;

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

    // YouTube
    } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
      const options = {
        method: "GET",
        url: `https://youtube-video-fast-downloader-24-7.p.rapidapi.com/download_video/${videoId}`,
        params: { quality: "247" }, // HD
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "youtube-video-fast-downloader-24-7.p.rapidapi.com"
        }
      };
      response = await axios.request(options);
      downloadUrl = response.data?.file || response.data?.reserved_file || null;
      thumbnail = response.data?.thumbnail || null;
      duration = response.data?.duration || null;

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
      const options = {
        method: "GET",
        url: "https://robotilab.xyz/download-api/tiktok/download",
        params: { videoUrl: url }
      };
      response = await axios.request(options);
      downloadUrl = response.data?.downloadUrl || response.data?.video?.download || null;
      thumbnail = response.data?.cover || response.data?.video?.thumbnail || null;
      duration = response.data?.video?.duration || null;
    }

    if (!downloadUrl) throw new Error("Download URL alınamadı");

    return { downloadUrl, thumbnail, duration };

  } catch (err) {
    console.error("RapidAPI error:", err.message);
    return { downloadUrl: null, error: err.message };
  }
}
