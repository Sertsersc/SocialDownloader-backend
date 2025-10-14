// ========================================
// server.js - HTTPS Fixli Final Sürüm ✅
// ========================================

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// HTTPS / SSL Ajanı - Hataları Engelle
// ========================================
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Sertifika hatalarını yoksay
});

axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 20000;
axios.defaults.headers.common['User-Agent'] =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ========================================
// Express Ayarları
// ========================================
app.enable('trust proxy');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request log
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========================================
// URL Normalizasyon Fonksiyonları
// ========================================
async function resolveRedirect(url) {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return response.request?.res?.responseUrl || url;
  } catch {
    return url;
  }
}

function normalizeInstagramUrl(url) {
  if (url.includes('?')) url = url.split('?')[0];
  if (!url.endsWith('/')) url += '/';
  return url;
}

async function normalizeTikTokUrl(url) {
  if (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
    url = await resolveRedirect(url);
  }
  if (url.includes('?')) url = url.split('?')[0];
  return url;
}

function normalizeFacebookUrl(url) {
  if (url.includes('fb.watch')) return url;
  if (url.includes('?')) return url.split('?')[0];
  return url;
}

// ========================================
// Ana Sayfa & Health
// ========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌐 Sosyal Medya Downloader API (HTTPS Fix)',
    version: '2.1',
    endpoints: {
      youtube: 'POST /api/youtube',
      instagram: 'POST /api/instagram',
      tiktok: 'POST /api/tiktok',
      facebook: 'POST /api/facebook',
    },
    status: 'Çalışıyor ✅',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ========================================
// YouTube Downloader
// ========================================
app.post('/api/youtube', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });

    if (!url.includes('youtube.com') && !url.includes('youtu.be'))
      return res.json({ success: false, message: 'Geçersiz YouTube URL' });

    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('watch?v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('/shorts/')) videoId = url.split('shorts/')[1].split('?')[0];
    else return res.json({ success: false, message: 'Video ID bulunamadı' });

    if (!process.env.RAPIDAPI_KEY) {
      return res.json({
        success: true,
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    }

    const options = {
      method: 'GET',
      url: 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details',
      params: { videoId },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com',
      },
    };

    const response = await axios.request(options);
    const video = response.data?.videos?.items?.[0];
    if (video) {
      return res.json({
        success: true,
        downloadUrl: video.url,
        title: response.data.title,
        thumbnail: response.data.thumbnail,
      });
    }

    res.json({
      success: true,
      downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    });
  } catch (error) {
    console.error('YouTube Error:', error.message);
    res.json({ success: false, message: 'YouTube hata: ' + error.message });
  }
});

// ========================================
// Instagram Downloader
// ========================================
app.all('/api/instagram', async (req, res) => {
  try {
    let url = req.method === 'GET' ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });
    if (!url.includes('instagram.com')) return res.json({ success: false, message: 'Geçersiz Instagram URL' });

    if (!process.env.RAPIDAPI_KEY)
      return res.json({ success: false, message: 'Instagram için RapidAPI key gerekli' });

    url = normalizeInstagramUrl(url);
    console.log('Normalized Instagram URL:', url);

    const options = {
      method: 'GET',
      url: 'https://instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com/convert',
      params: { url },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'instagram-downloader-download-instagram-stories-videos4.p.rapidapi.com',
      },
    };

    const response = await axios.request(options);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Instagram Error:', error.message);
    res.json({ success: false, message: 'Instagram hata: ' + error.message });
  }
});

// ========================================
// TikTok Downloader
// ========================================
app.all('/api/tiktok', async (req, res) => {
  try {
    let url = req.method === 'GET' ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });
    if (!url.includes('tiktok.com')) return res.json({ success: false, message: 'Geçersiz TikTok URL' });

    if (!process.env.RAPIDAPI_KEY)
      return res.json({ success: false, message: 'TikTok için RapidAPI key gerekli' });

    url = await normalizeTikTokUrl(url);

    const options = {
      method: 'GET',
      url: 'https://tiktok-video-downloader-api.p.rapidapi.com/media',
      params: { url },
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-video-downloader-api.p.rapidapi.com',
      },
    };

    const response = await axios.request(options);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('TikTok Error:', error.message);
    res.json({ success: false, message: 'TikTok hata: ' + error.message });
  }
});

// ========================================
// Facebook Downloader
// ========================================
app.all('/api/facebook', async (req, res) => {
  try {
    let url = req.method === 'GET' ? req.query.url : req.body.url;
    if (!url) return res.json({ success: false, message: 'URL gerekli' });
    if (!url.includes('facebook.com') && !url.includes('fb.watch'))
      return res.json({ success: false, message: 'Geçersiz Facebook URL' });

    if (!process.env.RAPIDAPI_KEY)
      return res.json({ success: false, message: 'Facebook için RapidAPI key gerekli' });

    url = normalizeFacebookUrl(url);

    const options = {
      method: 'POST',
      url: 'https://fdown1.p.rapidapi.com/download',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'fdown1.p.rapidapi.com',
      },
      data: { url },
    };

    const response = await axios.request(options);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Facebook Error:', error.message);
    res.json({ success: false, message: 'Facebook hata: ' + error.message });
  }
});

// ========================================
// 404 & Error Handler
// ========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Sunucu hatası: ' + err.message });
});

// ========================================
// Server Başlat
// ========================================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => process.exit(0));
});
