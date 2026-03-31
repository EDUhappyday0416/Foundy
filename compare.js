/**
 * compare.js — AI 寵物照片相似度比對
 * 使用 OpenAI Vision，極簡 prompt 以節省 token
 *
 * 環境變數：
 *   OPENAI_API_KEY  your OpenAI key
 *
 * 用法（Node）：
 *   const { comparePets } = require('./compare');
 *   const score = await comparePets(shelterImageUrl, userImageBase64);
 *
 * 用法（Express 路由，供前端 AI 比對按鈕呼叫）：
 *   app.post('/api/compare', upload.single('photo'), async (req, res) => {
 *     const score = await comparePets(req.body.shelterUrl, req.file.buffer);
 *     res.json({ score });
 *   });
 */

const axios = require('axios');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * 比對兩張寵物圖片相似度
 * @param {string} shelterImageUrl  收容所圖片 URL（公開可訪問）
 * @param {Buffer|string} userImage  用戶圖片：Buffer 或 base64 字串
 * @returns {Promise<number>} 0-100 相似度分數
 */
async function comparePets(shelterImageUrl, userImage) {
  // 若為 Buffer 轉 base64
  const b64 = Buffer.isBuffer(userImage)
    ? userImage.toString('base64')
    : userImage;

  const payload = {
    model: 'gpt-4o-mini',   // 比 gpt-4o 便宜 ~15x，Vision 能力足夠
    max_tokens: 10,          // 只要數字，極省 token
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            // 極簡 prompt：角色 + 任務 + 輸出格式，三行搞定
            text: 'You are a pet expert. Compare these two pet photos. Reply with ONLY a number 0-100 representing visual similarity (face, markings, body shape). No text.',
          },
          {
            type: 'image_url',
            image_url: { url: shelterImageUrl, detail: 'low' }, // low detail 省 token
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'low' },
          },
        ],
      },
    ],
  };

  const res = await axios.post(OPENAI_URL, payload, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const raw = res.data.choices[0].message.content.trim();
  const score = parseInt(raw, 10);
  if (isNaN(score)) throw new Error(`Unexpected AI response: ${raw}`);
  return Math.min(100, Math.max(0, score));
}

module.exports = { comparePets };
