const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { type } = req.query;
    let q = supabase.from('pets').select('*').order('created_at', { ascending: false });
    if (type && type !== 'all') q = q.eq('report_type', type);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { type, breed, color, location, date, traits, contact, status,
            photo, report_type, lat, lng, edit_token } = req.body;
    if (!location || !contact || !photo) {
      return res.status(400).json({ error: 'location, contact, photo are required' });
    }
    const { data, error } = await supabase
      .from('pets')
      .insert([{
        type, breed, color, location, date, traits, contact, status, photo,
        report_type: report_type || 'found',
        lat:  lat  || null,
        lng:  lng  || null,
        edit_token: edit_token || null,
        is_resolved: false,
      }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, id: data.id });
  }

  // ── PATCH（需要 edit_token）──────────────────────────────────────────────
  if (req.method === 'PATCH') {
    const { id } = req.query;
    const body = { ...req.body };
    const edit_token = body.edit_token;
    delete body.edit_token;
    delete body.id;
    delete body.created_at;

    const { data, error } = await supabase
      .from('pets')
      .update(body)
      .eq('id', id)
      .eq('edit_token', edit_token)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(403).json({ error: 'Invalid token' });
    return res.json({ ok: true });
  }

  // ── DELETE（需要 edit_token）─────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    const { edit_token } = req.body;
    const { data: pet } = await supabase.from('pets').select('edit_token').eq('id', id).single();
    if (!pet || pet.edit_token !== edit_token) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    const { error } = await supabase.from('pets').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
