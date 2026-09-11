export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false});
  const b=req.body||{};
  if(b.company_site) return res.status(200).json({ok:true});
  if(!b.email && !b.phone) return res.status(400).json({ok:false,error:'contact_required'});
  const payload={...b,receivedAt:new Date().toISOString()};
  const hook=process.env.LEAD_WEBHOOK_URL;
  if(hook){
    try{await fetch(hook,{method:'POST',headers:{'content-type':'application/json','x-re-source':'website'},body:JSON.stringify(payload)});}catch(e){console.error('webhook',e?.message)}
  }
  return res.status(200).json({ok:true});
}
