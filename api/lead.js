export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false,error:'method_not_allowed'});
  const b=typeof req.body==='string'?(()=>{try{return JSON.parse(req.body)}catch{return {}}})():(req.body||{});
  if(b.company_site) return res.status(200).json({ok:true});
  if(!b.email&&!b.phone) return res.status(400).json({ok:false,error:'contact_required'});

  const requestId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const payload={...b,requestId,receivedAt:new Date().toISOString()};
  const targets=[process.env.LEAD_WEBHOOK_URL,process.env.LEAD_BACKUP_WEBHOOK_URL].filter(Boolean);
  if(!targets.length){
    console.error(JSON.stringify({type:'lead_delivery_unconfigured',requestId,source:b.source||''}));
    return res.status(503).json({ok:false,error:'lead_delivery_unconfigured',requestId});
  }

  const attempts=await Promise.allSettled(targets.map(async url=>{
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),7000);
    try{
      const response=await fetch(url,{method:'POST',signal:ctrl.signal,headers:{'content-type':'application/json','x-re-source':'website','x-re-request-id':requestId},body:JSON.stringify(payload)});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      return {ok:true,status:response.status};
    } finally { clearTimeout(timer); }
  }));
  const delivered=attempts.some(x=>x.status==='fulfilled'&&x.value?.ok);
  if(!delivered){
    console.error(JSON.stringify({type:'lead_delivery_failed',requestId,errors:attempts.map(x=>x.status==='rejected'?String(x.reason?.message||x.reason):'unknown')}));
    return res.status(502).json({ok:false,error:'lead_delivery_failed',requestId});
  }
  console.log(JSON.stringify({type:'lead_delivered',requestId,tour:b.tour||'',source:b.source||''}));
  return res.status(200).json({ok:true,requestId});
}
