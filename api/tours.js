module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).end();
 const url=process.env.TOUR_DATA_URL;
 if(!url)return res.status(204).end();
 try{const r=await fetch(url,{headers:{accept:'application/json'}});if(!r.ok)return res.status(502).end();const data=await r.json();res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');return res.status(200).json(data)}catch{return res.status(502).end()}
};
