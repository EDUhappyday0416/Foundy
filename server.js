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
const { comparePets } = require('./compare');

const app    = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🐾 Server ready → http://localhost:${PORT}`));
