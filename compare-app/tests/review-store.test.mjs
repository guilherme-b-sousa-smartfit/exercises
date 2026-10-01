import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGrid,saveReview,HEADERS,validatePatch} from '../server/review-store.mjs';
import {SHEET_ID} from '../server/google.mjs';
import {authenticated,sessionCookie,requireEditor} from '../server/auth.mjs';
const cell=v=>({userEnteredValue:typeof v==='boolean'?{boolValue:v}:typeof v==='number'?{numberValue:v}:{stringValue:v}});
const headers=Object.values(HEADERS);
function fixture(){return {sheets:[{properties:{sheetId:SHEET_ID,title:'Comparação'},data:[{rowData:[{values:[cell('Link do site')]},{values:headers.map(cell)},{values:['Mesmo nome','https://smart/1','Supino','Press','https://gym/1',.85,false,false,'','',''].map(cell)},{values:['Mesmo nome','https://smart/2','Remada','Row','https://gym/2',.7,true,false,'Nota','',''].map(cell)}]}]}]};}
const metadata=[{metadataKey:'rid',metadataId:81,location:{dimensionRange:{sheetId:SHEET_ID,dimension:'ROWS',startIndex:2}}},{metadataKey:'rid',metadataId:82,location:{dimensionRange:{sheetId:SHEET_ID,dimension:'ROWS',startIndex:3}}}];
test('reads live header position, percentages, distinct identical names and row order',()=>{const d=parseGrid(fixture(),metadata);assert.deepEqual(d.rows.map(r=>[r.id,r.order,r.score,r.validated]),[[81,2,85,false],[82,3,70,true]]);assert.equal(d.columns.comments,8);});
test('fails closed on missing or duplicate review headers',()=>{const g=fixture();g.sheets[0].data[0].rowData[1].values[8]=cell('Outro');assert.throws(()=>parseGrid(g,metadata),/Coluna/);});
test('metadata keeps identity after moved rows',()=>{const g=fixture();const a=g.sheets[0].data[0].rowData;[a[2],a[3]]=[a[3],a[2]];const m=structuredClone(metadata);m[0].location.dimensionRange.startIndex=3;m[1].location.dimensionRange.startIndex=2;assert.deepEqual(parseGrid(g,m).rows.map(r=>r.id),[82,81]);});
test('patch writes by metadata ID, RAW text and null skips preserve all unrelated cells',async()=>{const d=parseGrid(fixture(),metadata);let sent;const result=await saveReview({id:81,base:{comments:''},patch:{comments:'=SUM(A1:A2)'}},{read:async()=>d,write:async p=>{sent=p;d.rows[0].comments='=SUM(A1:A2)';return {totalUpdatedRows:1};}});assert.equal(sent.valueInputOption,'RAW');assert.equal(sent.data[0].dataFilter.developerMetadataLookup.metadataId,81);assert.deepEqual(sent.data[0].values[0],[null,null,null,null,null,null,null,null,'=SUM(A1:A2)']);assert.equal(result.comments,'=SUM(A1:A2)');assert(!('_cells' in result));});
test('rejects stale edits without writing and retains other-field concurrent edits',async()=>{const d=parseGrid(fixture(),metadata);let writes=0;await assert.rejects(saveReview({id:82,base:{comments:''},patch:{comments:'new'}},{read:async()=>d,write:async()=>{writes++;}}),/Já existem dados/);assert.equal(writes,0);});
test('rejects invalid URLs, extra fields, invalid checkbox and deleted rows',async()=>{assert.throws(()=>validatePatch({id:81,base:{},patch:{replacementVideo:'javascript:alert(1)'}}));assert.throws(()=>validatePatch({id:81,base:{},patch:{name:'changed'}}));assert.throws(()=>validatePatch({id:81,base:{},patch:{validated:'yes'}}));await assert.rejects(saveReview({id:99,base:{comments:''},patch:{comments:'a'}},{read:async()=>parseGrid(fixture(),metadata)}),/removido/);});
test('readback mismatch never reports a successful save',async()=>{await assert.rejects(saveReview({id:81,base:{comments:''},patch:{comments:'x'}},{read:async()=>parseGrid(fixture(),metadata),write:async()=>({totalUpdatedRows:1})}),/não foi confirmada/);});
test('editing requires signed session and same origin',()=>{process.env.REVIEW_PASSWORD='test-only-password';const token=sessionCookie();const req={headers:{cookie:`review_session=${token}`,origin:'http://localhost:5173',host:'localhost:5173'}};assert(authenticated(req));assert.doesNotThrow(()=>requireEditor(req));assert.throws(()=>requireEditor({headers:{...req.headers,origin:'https://other.example'}}));assert(!authenticated({headers:{cookie:`review_session=${token}tamper`}}));});

test('any filled field requires confirmation and returns all current review values without writing',async()=>{
 const d=parseGrid(fixture(),metadata);let writes=0;
 await assert.rejects(saveReview({id:82,base:{comments:'Nota'},patch:{comments:'Nova nota'}},{read:async()=>d,write:async()=>{writes++;}}),e=>e.code==='REVIEW_CONFIRMATION_REQUIRED'&&e.current.comments==='Nota'&&e.current.validated===true&&e.current.replacementVideo==='');
 assert.equal(writes,0);
});
test('confirmation only overwrites requested fields and rechecks the complete current snapshot',async()=>{
 const d=parseGrid(fixture(),metadata),confirmed={validated:true,rejected:false,comments:'Nota',replacementTitle:'',replacementVideo:''};let writes=0;
 const transport={read:async()=>d,write:async p=>{writes++;assert.deepEqual(p.data[0].values[0],[null,null,null,null,null,null,null,null,'Nova nota']);d.rows[1].comments='Nova nota';return {totalUpdatedRows:1};}};
 await assert.rejects(saveReview({id:82,base:{comments:'Nota'},patch:{comments:'Nova nota'},confirmed:{...confirmed,validated:false}},transport),e=>e.code==='REVIEW_CONFIRMATION_REQUIRED');
 assert.equal(writes,0);
 const result=await saveReview({id:82,base:{comments:'Nota'},patch:{comments:'Nova nota'},confirmed},transport);
 assert.equal(writes,1);assert.equal(result.validated,true);assert.equal(result.comments,'Nova nota');
});
test('concurrent clearing also requires a new confirmation',async()=>{
 const d=parseGrid(fixture(),metadata);d.rows[1].validated=false;d.rows[1].comments='';
 await assert.rejects(saveReview({id:82,base:{comments:'Nota'},patch:{comments:'Minha nota'}},{read:async()=>d,write:async()=>assert.fail('must not write')}),e=>e.code==='REVIEW_CONFIRMATION_REQUIRED'&&e.current.comments==='');
});

test('rejected checkbox writes only its own column',async()=>{const d=parseGrid(fixture(),metadata);let payload;const row=await saveReview({id:81,base:{rejected:false},patch:{rejected:true}},{read:async()=>d,write:async p=>{payload=p;d.rows[0].rejected=true;return {totalUpdatedRows:1};}});assert.equal(row.rejected,true);assert.deepEqual(payload.data[0].values[0],[null,null,null,null,null,null,null,true]);});

test('author comes from server session and is written atomically with review',async()=>{const d=parseGrid(fixture(),metadata);let payload;const access={id:'admin',name:'Administrador'};const row=await saveReview({id:81,base:{comments:''},patch:{comments:'Revisado'},updatedBy:'Impostor'},{read:async()=>d,write:async p=>{payload=p;d.rows[0].comments='Revisado';d.rows[0].updatedBy='Administrador';return {totalUpdatedRows:1};}},access);assert.equal(payload.data[0].values[0][d.columns.updatedBy],'Administrador');assert.equal(payload.data[0].values[0][d.columns.comments],'Revisado');assert.equal(row.updatedBy,'Administrador');assert.throws(()=>validatePatch({id:81,base:{},patch:{updatedBy:'Outro'}}));});
