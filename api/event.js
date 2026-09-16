const ALLOWED=new Set(['tour_view','finder_open','finder_complete','travel_filter','tour_cta','booking_start','lead_success','lead_fail','lead_validation_error','phone_click']);
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({ok:false});
  let b=req.body||{};
  if(typeof b==='string'){try{b=JSON.parse(b)}catch{b={}}}
  if(!ALLOWED.has(b.event)) return res.status(204).end();
  const event={event:b.event,path:String(b.path||'').slice(0,160),ts:Number(b.ts)||Date.now(),filter:b.filter,results:b.results,tour:String(b.tour||'').slice(0,120),href:String(b.href||'').slice(0,180),source:String(b.source||'').slice(0,100),recommendation:String(b.recommendation||'').slice(0,120),reason:String(b.reason||'').slice(0,80)};
  console.log(JSON.stringify({type:'cro_event',...event}));
  const hook=process.env.ANALYTICS_WEBHOOK_URL;
  if(hook){try{await fetch(hook,{method:'POST',headers:{'content-type':'application/json','x-re-source':'cro'},body:JSON.stringify(event)});}catch(e){console.error('analytics_webhook',e?.message)}}
  return res.status(204).end();
}
