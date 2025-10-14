// ========================================
// server.js - Railway için optimize edilmiş
// ========================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');

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
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sosyal Medya İndirici API - Railway',
    version: '2.0',
    endpoints: {
      youtube: 'POST /api/youtube',
      instagram: 'POST /api/instagram',
      tiktok: 'POST /api/tiktok',
      facebook: 'POST /api/facebook'
    },
    status: 'Çalışıyor ✅',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
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
app.post('/api/instagram', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.json({
                success: false,
                message: 'URL gerekli'
            });
        }

        if (!url.includes('instagram.com')) {
            return res.json({
                success: false,
                message: 'Geçersiz Instagram URL'
            });
        }

        if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
            return res.json({
                success: false,
                message: 'Instagram için RapidAPI key gerekli. Lütfen environment variable ekleyin.'
            });
        }

        const options = {
            method: 'GET',
            url: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index',
            params: { url: url },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
            },
            timeout: 10000
        };

        const response = await axios.request(options);
        
        if (response.data && response.data.media) {
            res.json({
                success: true,
                downloadUrl: response.data.media,
                title: response.data.title || 'Instagram Video',
                thumbnail: response.data.thumbnail
            });
        } else {
            res.json({
                success: false,
                message: 'Video bilgisi alınamadı'
            });
        }

    } catch (error) {
        console.error('Instagram Error:', error.message);
        res.json({
            success: false,
            message: 'Instagram için RapidAPI key gerekli veya hata oluştu: ' + error.message
        });
    }
});

// TikTok Downloader
app.post('/api/tiktok', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.json({
                success: false,
                message: 'URL gerekli'
            });
        }

        if (!url.includes('tiktok.com')) {
            return res.json({
                success: false,
                message: 'Geçersiz TikTok URL'
            });
        }

        if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
            return res.json({
                success: false,
                message: 'TikTok için RapidAPI key gerekli'
            });
        }

        const options = {
            method: 'GET',
            url: 'https://tiktok-download-without-watermark.p.rapidapi.com/analysis',
            params: { url: url },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com'
            },
            timeout: 10000
        };

        const response = await axios.request(options);
        
        if (response.data && response.data.data) {
            res.json({
                success: true,
                downloadUrl: response.data.data.play,
                title: response.data.data.title || 'TikTok Video',
                thumbnail: response.data.data.cover
            });
        } else {
            res.json({
                success: false,
                message: 'Video bilgisi alınamadı'
            });
        }

    } catch (error) {
        console.error('TikTok Error:', error.message);
        res.json({
            success: false,
            message: 'TikTok için RapidAPI key gerekli veya hata: ' + error.message
        });
    }
});

// Facebook Downloader
app.post('/api/facebook', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.json({
                success: false,
                message: 'URL gerekli'
            });
        }

        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return res.json({
                success: false,
                message: 'Geçersiz Facebook URL'
            });
        }

        if (!process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here') {
            return res.json({
                success: false,
                message: 'Facebook için RapidAPI key gerekli'
            });
        }

        const options = {
            method: 'GET',
            url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php',
            params: { url: url },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
            },
            timeout: 10000
        };

        const response = await axios.request(options);
        
        if (response.data && response.data.links) {
            res.json({
                success: true,
                downloadUrl: response.data.links['Download High Quality'],
                title: 'Facebook Video'
            });
        } else {
            res.json({
                success: false,
                message: 'Video bilgisi alınamadı'
            });
        }

    } catch (error) {
        console.error('Facebook Error:', error.message);
        res.json({
            success: false,
            message: 'Facebook için RapidAPI key gerekli veya hata: ' + error.message
        });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı',
        path: req.path,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'POST /api/youtube',
            'POST /api/instagram',
            'POST /api/tiktok',
            'POST /api/facebook'
        ]
    });
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
