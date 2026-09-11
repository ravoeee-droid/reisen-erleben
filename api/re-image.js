const ALLOWED=new Set(['reisenunderleben.net','www.reisenunderleben.net']);
const FALLBACK='/images/slideshow/CAR60003.jpg';

function svgFallback(){return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b1710"/><stop offset=".58" stop-color="#203a2a"/><stop offset="1" stop-color="#8f3e23"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><path d="M-80 820C260 590 520 890 850 590s530-230 900-520" fill="none" stroke="#ff5a26" stroke-width="11" opacity=".9"/><text x="90" y="820" fill="#fff" font-family="Georgia,serif" font-size="80">REISEN &amp; ERLEBEN</text><text x="95" y="885" fill="#ff936f" font-family="Arial,sans-serif" font-size="24" letter-spacing="5">MOTORRADREISEN</text></svg>`);}

module.exports=async(req,res)=>{
  try{
    const raw=Array.isArray(req.query?.src)?req.query.src[0]:req.query?.src;
    if(!raw) return res.status(400).send('missing src');
    const requested=new URL(raw);
    if(!ALLOWED.has(requested.hostname)||!requested.pathname.startsWith('/images/')) return res.status(403).send('forbidden');
    const candidates=[
      new URL(requested.pathname+requested.search,'https://www.reisenunderleben.net'),
      new URL(requested.pathname+requested.search,'https://reisenunderleben.net')
    ];
    for(const u of candidates){
      try{
        const r=await fetch(u,{headers:{'user-agent':'Mozilla/5.0 (compatible; ReisenErleben/5.0)','referer':'https://www.reisenunderleben.net/'},redirect:'follow',signal:AbortSignal.timeout(9000)});
        const type=r.headers.get('content-type')||'';
        if(r.ok&&type.startsWith('image/')){
          const body=Buffer.from(await r.arrayBuffer());
          res.setHeader('Content-Type',type);
          res.setHeader('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
          return res.status(200).send(body);
        }
      }catch{}
    }
  }catch{}
  res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600, s-maxage=86400');
  return res.status(200).send(svgFallback());
};
