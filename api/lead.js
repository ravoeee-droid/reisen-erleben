module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'method_not_allowed' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const clean = {
    name: String(body.name || '').slice(0,120),
    email: String(body.email || '').slice(0,180),
    phone: String(body.phone || '').slice(0,80),
    message: String(body.message || '').slice(0,2500),
    tour: String(body.tour || body.matchedTour || '').slice(0,160),
    source: String(body.source || 'website').slice(0,160),
    answers: body.answers && typeof body.answers === 'object' ? body.answers : undefined,
    createdAt: new Date().toISOString()
  };
  if (!clean.email && !clean.phone) return res.status(400).json({ ok:false, error:'contact_required' });

  const targets = [process.env.LEAD_WEBHOOK_URL, process.env.WHATSAPP_WEBHOOK_URL].filter(Boolean);
  const results = await Promise.allSettled(targets.map(url => fetch(url, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(clean)
  })));

  return res.status(200).json({ ok:true, forwarded:targets.length, results:results.map(r=>r.status) });
};
