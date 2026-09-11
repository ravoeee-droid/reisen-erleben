/**
 * Tobi server adapter.
 * - If TOBI_WEBHOOK_URL is configured, forwards a compact conversation payload to n8n/Make/CRM/AI service.
 * - Otherwise the browser-side expert engine remains the fallback so the site never breaks.
 * No provider credentials are exposed to the client.
 */
module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method_not_allowed'});
  const {message,history=[],context={},tours=[]}=req.body||{};
  if(!message||typeof message!=='string') return res.status(400).json({error:'message_required'});
  const webhook=process.env.TOBI_WEBHOOK_URL;
  if(!webhook) return res.status(204).end();
  try{
    const r=await fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({assistant:'tobi',message:message.slice(0,2000),history:history.slice(-10),context,tours,site:'reisen-erleben'})});
    if(!r.ok) return res.status(204).end();
    const data=await r.json().catch(()=>({}));
    const reply=data.reply||data.message||data.output;
    if(!reply) return res.status(204).end();
    return res.status(200).json({reply:String(reply)});
  }catch(e){return res.status(204).end();}
};
