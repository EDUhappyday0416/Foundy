const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — 取得所有拾獲紀錄
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // POST — 新增拾獲紀錄（照片已由前端上傳到 Cloudinary，這裡只收 URL）
  if (req.method === 'POST') {
    const { type, breed, color, location, date, traits, contact, status, photo } = req.body;

    if (!location || !contact || !photo) {
      return res.status(400).json({ error: 'location, contact, photo are required' });
    }

    const { data, error } = await supabase
      .from('pets')
      .insert([{ type, breed, color, location, date, traits, contact, status, photo }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, id: data.id });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
