import {authenticated,json,errorResponse} from '../server/auth.mjs';
import {resolvePreview} from '../server/gymvisual-preview.mjs';
export default async function handler(req,res){try{if(req.method!=='GET')return json(res,405,{error:'Método não permitido.'});if(!authenticated(req))return json(res,401,{error:'Entre para visualizar o vídeo substituto.'});const url=new URL(req.url,'http://localhost').searchParams.get('url');return json(res,200,await resolvePreview(url));}catch(e){return errorResponse(res,e);}}
