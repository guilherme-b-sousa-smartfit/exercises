import {canAccessRow} from '../server/reviewers.mjs';
import {readReviewData,saveReview,publicRow} from '../server/review-store.mjs';
import {accessFor,authenticated,requireEditor,json,errorResponse,bodyOf} from '../server/auth.mjs';
export default async function handler(req,res){try{
 if(req.method==='GET'){const access=accessFor(req);if(!access)return json(res,200,{rows:[],canEdit:false,access:null,updatedAt:new Date().toISOString()});const data=await readReviewData();return json(res,200,{rows:data.rows.filter(row=>canAccessRow(access,row)).map(publicRow),canEdit:authenticated(req),access,updatedAt:new Date().toISOString()});}
 if(req.method==='PATCH'){const access=requireEditor(req);const row=await saveReview(await bodyOf(req),undefined,access);return json(res,200,{row});}
 return json(res,405,{error:'Método não permitido.'});
 }catch(e){return errorResponse(res,e);}}
