import {isAuthorized,safeMutation,respond} from './_auth.js';
import {getDb,table} from './_db.js';
const allowable=['pending','confirmed','completed','cancelled'];
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+'T00:00:00').getTime());
const validTime=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const str=(v,n=250)=>typeof v==='string'?v.trim().slice(0,n):'';
function sanitize(b){return {booked_for:str(b.booked_for,10),start_time:str(b.start_time,5),end_time:str(b.end_time,5),resource:str(b.resource,120),booked_by:str(b.booked_by,120),department:str(b.department,120),purpose:str(b.purpose,1000),status:str(b.status,30)||'confirmed',notes:str(b.notes,1000)}}
function validate(b){if(!validDate(b.booked_for)||!validTime(b.start_time)||!validTime(b.end_time)||b.end_time<=b.start_time)return 'Provide a valid date and time range.';if(!b.booked_by||!b.resource)return 'Booker name and resource are required.';if(!allowable.includes(b.status))return 'Invalid booking status.';return null}
export default async function handler(req,res){
if(!isAuthorized(req))return respond(res,401,{error:'Sign in required.'});
const db=getDb();if(!db)return respond(res,503,{error:'A dedicated Supabase project has not been configured yet.',code:'DB_NOT_CONFIGURED'});
if(req.method!=='GET'&&!safeMutation(req))return respond(res,403,{error:'Invalid request origin.'});
try{
if(req.method==='GET'){const {data,error}=await db.from(table).select('*').order('booked_for',{ascending:false}).order('start_time',{ascending:false}).limit(5000);if(error)throw error;return respond(res,200,{bookings:data||[]})}
if(req.method==='POST'){const b=sanitize(req.body||{});const err=validate(b);if(err)return respond(res,400,{error:err});const {data,error}=await db.from(table).insert(b).select('*').single();if(error)throw error;return respond(res,201,{booking:data})}
if(req.method==='PATCH'){const {id,...rest}=req.body||{};if(!/^[0-9a-f-]{36}$/i.test(id||''))return respond(res,400,{error:'Invalid booking ID.'});const b=sanitize(rest);const err=validate(b);if(err)return respond(res,400,{error:err});const {data,error}=await db.from(table).update(b).eq('id',id).select('*').single();if(error)throw error;return respond(res,200,{booking:data})}
if(req.method==='DELETE'){const id=req.body?.id;if(!/^[0-9a-f-]{36}$/i.test(id||''))return respond(res,400,{error:'Invalid booking ID.'});const {data,error}=await db.from(table).update({status:'cancelled'}).eq('id',id).select('*').single();if(error)throw error;return respond(res,200,{booking:data})}
res.setHeader('Allow','GET, POST, PATCH, DELETE');return respond(res,405,{error:'Method not allowed.'});
}catch(e){const conflict=e.code==='23505';console.error('Booking data operation failed:',e.code||e.message);return respond(res,conflict?409:500,{error:conflict?'This resource is already booked for that date and start time.':'Unable to complete database request.'})}
}
