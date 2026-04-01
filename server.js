/**
 * server.js — 輕量 Express 後端
 * 提供 /api/compare 端點給前端 AI 比對按鈕呼叫
 *
 * npm install express multer cors dotenv axios
 * OPENAI_API_KEY=sk-xxx node server.js
 */

require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { comparePets } = require('./compare');

// 照片存到 uploads/ 資料夾
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const app        = express();
const upload     = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadDisk = multer({ storage: diskStorage,           limits: { fileSize: 5 * 1024 * 1024 } });

// 簡易 JSON 檔案 DB
const DB_PATH = path.join(__dirname, 'db.json');
function loadDB()   { return fs.existsSync(DB_PATH) ? JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) : []; }
function saveDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
const reports = loadDB();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));       // 直接 serve index.html

/**
 * POST /api/compare
 * Body (multipart/form-data):
 *   photo       - 用戶上傳的圖片 file
 *   shelterUrl  - 收容所圖片 URL
 */
app.post('/api/compare', upload.single('photo'), async (req, res) => {
  try {
    const { shelterUrl } = req.body;
    if (!shelterUrl || !req.file) {
      return res.status(400).json({ error: 'shelterUrl and photo are required' });
    }
    const score = await comparePets(shelterUrl, req.file.buffer);
    res.json({ score });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/report
 * 上傳拾獲寵物表單
 */
app.post('/api/report', uploadDisk.single('photo'), (req, res) => {
  const { type, breed, color, location, date, traits, contact, status } = req.body;
  if (!req.file || !location || !contact) {
    return res.status(400).json({ error: 'photo, location, contact are required' });
  }
  const record = {
    id:       Date.now(),
    type, breed, color, location, date, traits, contact, status,
    photo:    `/uploads/${req.file.filename}`,
    created:  new Date().toISOString(),
  };
  reports.push(record);
  saveDB(reports);
  console.log('📋 新增回報:', record.id, location);
  res.json({ ok: true, id: record.id });
});

/**
 * GET /api/reports
 * 取得所有拾獲紀錄（供 Dashboard 使用）
 */
app.get('/api/reports', (_req, res) => {
  res.json(reports);
});

app.use('/uploads', express.static(uploadDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🐾 Server ready → http://localhost:${PORT}`));
