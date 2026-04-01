const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { shelterUrl, userUrl } = req.body;
  if (!shelterUrl || !userUrl) {
    return res.status(400).json({ error: 'shelterUrl and userUrl are required' });
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'You are a pet expert. Compare these two pet photos. Reply with ONLY a number 0-100 representing visual similarity. No text.' },
          { type: 'image_url', image_url: { url: shelterUrl, detail: 'low' } },
          { type: 'image_url', image_url: { url: userUrl,    detail: 'low' } },
        ],
      }],
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
  );

  const score = parseInt(response.data.choices[0].message.content.trim(), 10);
  res.json({ score: Math.min(100, Math.max(0, score)) });
};
