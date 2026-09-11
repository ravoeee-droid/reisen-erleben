module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).end();
 const p=req.body||{};if(!p.name)return res.status(400).end();
 const url=process.env.ANALYTICS_WEBHOOK_URL;
 if(url){try{await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...p,project:'reisen-erleben'})})}catch{}}
 return res.status(204).end();
};
