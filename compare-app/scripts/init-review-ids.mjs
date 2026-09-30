import fs from 'node:fs';
import {homedir} from 'node:os';
if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON)process.env.GOOGLE_SERVICE_ACCOUNT_JSON=fs.readFileSync(`${homedir()}/.config/claude-sheets-sa.json`,'utf8');
const {readReviewData}=await import('../server/review-store.mjs');const {sheets,SHEET_ID}=await import('../server/google.mjs');
const data=await readReviewData();const missing=data.rows.filter(r=>!r.id);
for(let i=0;i<missing.length;i+=200){const batch=missing.slice(i,i+200);await sheets(':batchUpdate',{method:'POST',body:JSON.stringify({requests:batch.map(r=>({createDeveloperMetadata:{developerMetadata:{metadataKey:'rid',visibility:'DOCUMENT',location:{dimensionRange:{sheetId:SHEET_ID,dimension:'ROWS',startIndex:r.order,endIndex:r.order+1}}}}}))})});}
const verify=await readReviewData();if(verify.rows.some(r=>!r.id)||new Set(verify.rows.map(r=>r.id)).size!==verify.rows.length)throw Error('IDs inválidos');console.log({rows:verify.rows.length,created:missing.length});
