require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Слишком много попыток. Попробуйте позже.' } });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

// Static files with caching
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));
app.use('/videos', (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.setHeader('Accept-Ranges', 'bytes');
  next();
}, express.static(path.join(__dirname, 'public/videos')));
// Serve React build (production) — must be before public static
const fs = require('fs');
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// API Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/content', apiLimiter, require('./routes/content'));
app.use('/api/subscription', apiLimiter, require('./routes/subscription'));
app.use('/api/progress', apiLimiter, require('./routes/progress'));
app.use('/api/analytics', apiLimiter, require('./routes/analytics'));

// Video streaming with range support
app.get('/stream/:videoId', require('./middleware/auth').optionalAuth, async (req, res) => {
  const fs = require('fs');
  const { getDb, dbGet, dbRun } = require('./database/init');
  const db = getDb();
  const method = await dbGet(db, 'SELECT video_url FROM methods WHERE id = ?', [req.params.videoId]);
  if (!method || !method.video_url) return res.status(404).json({ error: 'Видео не найдено' });

  const videoPath = path.join(__dirname, 'public', method.video_url);
  if (!fs.existsSync(videoPath)) return res.status(404).json({ error: 'Файл не найден' });

  if (req.user) {
    await dbRun(db, 'INSERT INTO analytics_events (user_id, event_type, entity_type, entity_id) VALUES (?,?,?,?)', [req.user.id, 'video_view', 'method', req.params.videoId]);
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const file = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${fileSize}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': 'video/mp4', 'Cache-Control': 'public, max-age=86400' });
    file.pipe(res);
  } else {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': 'video/mp4', 'Cache-Control': 'public, max-age=86400' });
    fs.createReadStream(videoPath).pipe(res);
  }
});

// SPA fallback — serve React app if built, otherwise original public/index.html
app.get('*', (req, res) => {
  const reactIndex = path.join(clientDist, 'index.html');
  if (fs.existsSync(reactIndex)) {
    res.sendFile(reactIndex);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`\n🧠 Нейропсихологический центр запущен: http://localhost:${PORT}`);
  console.log(`📊 Окружение: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
