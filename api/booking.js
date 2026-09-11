module.exports=async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 const {slot,name,email,phone,tourId,source='tobi'}=req.body||{};
 if(!slot)return res.status(400).json({error:'slot_required'});
 const url=process.env.BOOKING_WEBHOOK_URL||process.env.LEAD_WEBHOOK_URL;
 const payload={type:'consultation_booking',slot,name,email,phone,tourId,source,createdAt:new Date().toISOString()};
 if(!url)return res.status(202).json({ok:true,status:'pending_calendar_connection'});
 try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});return res.status(r.ok?200:502).json({ok:r.ok,status:r.ok?'forwarded':'provider_error'})}catch{return res.status(502).json({ok:false,status:'provider_unreachable'})}
};
