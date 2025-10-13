const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { execFile } = require('child_process');
const ytdlp = require('yt-dlp-exec');
const fetch = require('node-fetch');


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


app.use(cors());
app.use(bodyParser.json());

// -------------------- YouTube --------------------
app.post('/api/youtube', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gönderilmedi' });

    try {
        const info = await ytdlp(url, { dumpJson: true, noWarnings: true });
        res.json({
            success: true,
            title: info.title,
            downloadUrl: info.url || info.formats[0].url
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'YouTube hatası: ' + error.message });
    }
});

// -------------------- Instagram --------------------
app.post('/api/instagram', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gönderilmedi' });

    try {
        const info = await ytdlp(url, { dumpJson: true, noWarnings: true });
        res.json({
            success: true,
            title: info.title || 'Instagram Video',
            downloadUrl: info.url || info.formats[0].url
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Instagram hatası: ' + error.message });
    }
});

// -------------------- TikTok --------------------
app.post('/api/tiktok', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gönderilmedi' });

    try {
        const info = await ytdlp(url, { dumpJson: true, noWarnings: true });
        res.json({
            success: true,
            title: info.title || 'TikTok Video',
            downloadUrl: info.url || info.formats[0].url
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'TikTok hatası: ' + error.message });
    }
});

// -------------------- Facebook --------------------
app.post('/api/facebook', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gönderilmedi' });

    try {
        const info = await ytdlp(url, { dumpJson: true, noWarnings: true });
        res.json({
            success: true,
            title: info.title || 'Facebook Video',
            downloadUrl: info.url || info.formats[0].url
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Facebook hatası: ' + error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

