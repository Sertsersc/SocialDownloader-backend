// ========================================
// server.js - Railway için optimize edilmiş
// ========================================

import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ana sayfa - Test endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Sosyal Medya İndirici API - Railway",
    version: "2.0",
    endpoints: {
      youtube: "POST /api/youtube",
      instagram: "POST /api/instagram",
      tiktok: "POST /api/tiktok",
      facebook: "POST /api/facebook"
    },
    status: "Çalışıyor ✅",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
// YouTube Downloader (RapidAPI ile)
app.post('/api/youtube', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.json({
                success: false,
                message: 'URL gerekli'
            });
        }
        
        // URL doğrulama
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return res.json({
                success: false,
                message: 'Geçersiz YouTube URL'
            });
        }

        // Video ID'yi çıkar
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtube.com/shorts/')) {
            videoId = url.split('shorts/')[1].split('?')[0];
        } else {
            return res.json({
                success: false,
                message: 'Video ID bulunamadı'
            });
        }

        console.log('YouTube Video ID:', videoId);

        // RapidAPI key kontrolü
        if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
            // API key yoksa basit yanıt dön
            return res.json({
                success: true,
                downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                message: 'API key olmadan sınırlı servis. RapidAPI key ekleyin.',
                videoId: videoId
            });
        }

        // RapidAPI ile video bilgisi al
        const options = {
            method: 'GET',
            url: 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details',
            params: { videoId: videoId },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com'
            },
            timeout: 10000
        };

        const response = await axios.request(options);
        
        if (response.data && response.data.videos) {
            const video = response.data.videos.items[0];
            res.json({
                success: true,
                downloadUrl: video.url,
                title: response.data.title || 'YouTube Video',
                thumbnail: response.data.thumbnail,
                duration: response.data.duration,
                videoId: videoId
            });
        } else {
            res.json({
                success: true,
                downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
                title: 'YouTube Video',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                videoId: videoId
            });
        }

    } catch (error) {
        console.error('YouTube Error:', error.message);
        res.json({
            success: false,
            message: 'Video indirilemedi: ' + error.message
        });
    }
});

// Instagram Downloader
app.all('/api/instagram', async (req, res) => {
  try {
    const url = req.method === 'GET' ? req.query.url : req.body.url;

    if (!url) {
      return res.json({ success: false, message: 'URL gerekli' });
    }
    if (!url.includes('instagram.com')) {
      return res.json({ success: false, message: 'Geçersiz Instagram URL' });
    }
    if (!process.env.RAPIDAPI_KEY) {
      return res.json({ success: false, message: 'Instagram için RapidAPI key gerekli' });
    }

    // options ROUTE İÇİNDE TANIMLI
    const options = {
      method: 'POST',
      url: 'https://instagram-reels-downloader-api.p.rapidapi.com/download',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'instagram-reels-downloader-api.p.rapidapi.com'
      },
      data: { url }
    };

    const response = await axios.request(options);
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Instagram Error:', error.response?.data || error.message);
    return res.json({
      success: false,
      message: 'Instagram hata: ' + (error.response?.data?.message || error.message)
    });
  }
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Render/Railway port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});

// TikTok Downloader
app.all('/api/tiktok', async (req, res) => {
  try {
    const url = req.method === 'GET' ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });
    if (!url.includes('tiktok.com')) return res.json({ success: false, message: 'Geçersiz TikTok URL' });
    if (!process.env.RAPIDAPI_KEY) return res.json({ success: false, message: 'TikTok için RapidAPI key gerekli' });

    const options = {
      method: 'GET',
      url: 'https://tiktok-video-downloader-api.p.rapidapi.com/media',
      params: { url },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-video-downloader-api.p.rapidapi.com'
      },
      timeout: 20000
    };

    const response = await axios.request(options);
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('TikTok Error:', error.response?.data || error.message);
    return res.json({ success: false, message: 'TikTok hata: ' + (error.response?.data?.message || error.message) });
  }
});

// Facebook Downloader (FDown API)
app.all('/api/facebook', async (req, res) => {
  try {
    const url = req.method === 'GET' ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });
    if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
      return res.json({ success: false, message: 'Geçersiz Facebook URL' });
    }
    if (!process.env.RAPIDAPI_KEY) return res.json({ success: false, message: 'Facebook için RapidAPI key gerekli' });

    const options = {
      method: 'POST',
      url: 'https://fdown1.p.rapidapi.com/download',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'fdown1.p.rapidapi.com'
      },
      data: { url },
      timeout: 20000
    };

    const response = await axios.request(options);
    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Facebook Error:', error.response?.data || error.message);
    return res.json({ success: false, message: 'Facebook hata: ' + (error.response?.data?.message || error.message) });
  }
});
// Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Sunucu hatası: ' + err.message
    });
});

// Sunucuyu başlat
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Ready to accept connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});
