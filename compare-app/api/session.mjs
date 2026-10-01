import {accessFor,authenticated,checkPassword,checkOrigin,sessionCookie,json,errorResponse,bodyOf} from '../server/auth.mjs';
export default async function handler(req,res){try{
 if(req.method==='GET')return json(res,200,{canEdit:authenticated(req),access:accessFor(req)});
 const secure=req.headers.host?.startsWith('localhost:')||req.headers.host?.startsWith('127.0.0.1:')?'':'; Secure';
 if(req.method==='DELETE'){checkOrigin(req);res.setHeader('Set-Cookie',`review_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`);return json(res,200,{canEdit:false});}
 if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
 const body=await bodyOf(req);const access=checkPassword(req,body.password);res.setHeader('Set-Cookie',`review_session=${sessionCookie(access)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure}`);return json(res,200,{canEdit:access.id!=='icaro',access});
 }catch(e){return errorResponse(res,e);}}
