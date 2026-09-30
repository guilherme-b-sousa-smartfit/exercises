import {readReviewData,saveReview,publicRow} from '../server/review-store.mjs';
import {authenticated,requireEditor,json,errorResponse,bodyOf} from '../server/auth.mjs';
export default async function handler(req,res){try{
 if(req.method==='GET'){const data=await readReviewData();return json(res,200,{rows:data.rows.map(publicRow),canEdit:authenticated(req),updatedAt:new Date().toISOString()});}
 if(req.method==='PATCH'){requireEditor(req);const row=await saveReview(await bodyOf(req));return json(res,200,{row});}
 return json(res,405,{error:'Método não permitido.'});
 }catch(e){return errorResponse(res,e);}}
