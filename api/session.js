import {isAuthorized,validCredentials,loginCookie,logoutCookie,safeMutation,respond} from './_auth.js';
export default async function handler(req,res){
if(req.method==='GET')return respond(res,200,{authenticated:isAuthorized(req),configured:Boolean(process.env.ADMIN_PASSWORD_SCRYPT&&process.env.SESSION_SECRET)});
if(req.method==='POST'){if(!safeMutation(req))return respond(res,403,{error:'Invalid request origin.'});const {username='',password=''}=req.body||{};if(!validCredentials(username,password))return respond(res,401,{error:'Invalid username or password.'});res.setHeader('Set-Cookie',loginCookie());return respond(res,200,{authenticated:true})}
if(req.method==='DELETE'){if(!safeMutation(req))return respond(res,403,{error:'Invalid request origin.'});res.setHeader('Set-Cookie',logoutCookie());return respond(res,200,{authenticated:false})}
res.setHeader('Allow','GET, POST, DELETE');return respond(res,405,{error:'Method not allowed.'});
}
