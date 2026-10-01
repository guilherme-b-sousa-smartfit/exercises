import {canAccessRow} from './reviewers.mjs';
import { sheets, SHEET_ID } from './google.mjs';
export const HEADERS={name:'Nome Smart',smartVideo:'Vídeo Smart',gymNamePt:'Nome GymVisual em PTBR',gymName:'Nome GymVisual',gymVideo:'Vídeo GymVisual',score:'Porcentagem de certeza de comparação',validated:'Validado',rejected:'Reprovado',comments:'Comentários',replacementTitle:'Título do vídeo substituto',replacementVideo:'Vídeo substituto',updatedBy:'Alterado por'};
export const EDITABLE=['validated','rejected','comments','replacementTitle','replacementVideo'];
export const valueOf=c=>c?.effectiveValue?.stringValue??c?.effectiveValue?.numberValue??c?.effectiveValue?.boolValue??c?.userEnteredValue?.stringValue??c?.userEnteredValue?.numberValue??c?.userEnteredValue?.boolValue??'';
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
export function parseGrid(grid,metadata=[]) {
 const sheet=grid.sheets?.find(s=>s.properties.sheetId===SHEET_ID);
 if(!sheet)throw fail('A aba de comparação não foi encontrada.',503);
 const cells=sheet.data?.[0]?.rowData||[],offset=sheet.data?.[0]?.startRow||0;
 const headerIndex=cells.findIndex(r=>r.values?.some(c=>valueOf(c)===HEADERS.name));
 if(headerIndex<0)throw fail('Cabeçalho da comparação não encontrado.',503);
 const headers=cells[headerIndex].values.map(valueOf),columns={};
 for(const [key,label] of Object.entries(HEADERS)){const indexes=headers.flatMap((x,i)=>x===label?[i]:[]);if(indexes.length!==1)throw fail(`Coluna ausente ou duplicada: ${label}`,503);columns[key]=indexes[0];}
 const ids=new Map();
 for(const m of metadata){const d=m.location?.dimensionRange;if(m.metadataKey==='rid'&&d?.sheetId===SHEET_ID&&d.dimension==='ROWS'){const previous=ids.get(d.startIndex);if(!previous||m.metadataId<previous)ids.set(d.startIndex,m.metadataId);}}
 const rows=cells.slice(headerIndex+1).flatMap((r,i)=>{
  const values=r.values||[],rowIndex=offset+headerIndex+i+1;
  if(!String(valueOf(values[columns.name])).trim())return [];
  const entry={id:ids.get(rowIndex)||null,order:rowIndex,rowNumber:rowIndex+1};
  for(const [key,col] of Object.entries(columns))entry[key]=valueOf(values[col]);
  entry.name=String(entry.name);entry.score=Math.max(0,Math.min(100,typeof entry.score==='number'?entry.score*100:Number(String(entry.score).replace('%','').replace(',','.'))||0));
  for(const key of ['validated','rejected'])entry[key]=entry[key]===true||['true','verdadeiro','sim','1'].includes(String(entry[key]).toLowerCase());
  for(const key of ['smartVideo','gymNamePt','gymName','gymVideo','comments','replacementTitle','replacementVideo','updatedBy'])entry[key]=String(entry[key]??'');
  return [{...entry,_cells:values}];
 });return {rows,columns,headerRow:offset+headerIndex,title:sheet.properties.title};
}
export async function readReviewData() {
 const grid=await sheets(`?includeGridData=true&ranges=${encodeURIComponent("'Comparação'!A1:AZ")}&fields=${encodeURIComponent('sheets(properties,data(startRow,rowData(values(userEnteredValue,effectiveValue,hyperlink))))')}`);
 const meta=await sheets('/developerMetadata:search',{method:'POST',body:JSON.stringify({dataFilters:[{developerMetadataLookup:{metadataKey:'rid',visibility:'DOCUMENT'}}]})});
 return parseGrid(grid,(meta.matchedDeveloperMetadata||[]).map(x=>x.developerMetadata));
}
export function publicRow(row){const {_cells,...rest}=row;return rest;}
export function validatePatch(body) {
 if(!body||!Number.isInteger(body.id)||body.id<1||typeof body.patch!=='object'||!body.patch||Array.isArray(body.patch)||!body.base)throw fail('Revisão inválida. Atualize a página.');
 const keys=Object.keys(body.patch);if(!keys.length||keys.some(k=>!EDITABLE.includes(k)))throw fail('Campo de edição inválido.');
 for(const key of keys){const v=body.patch[key];if((key==='validated'||key==='rejected')){if(typeof v!=='boolean')throw fail('Validação deve ser verdadeira ou falsa.');}else{if(typeof v!=='string'||v.length>(key==='comments'?5000:key==='replacementTitle'?500:2048))throw fail('Texto inválido ou muito longo.');}}
 if(body.patch.replacementVideo){let u;try{u=new URL(body.patch.replacementVideo);}catch{throw fail('Informe um link completo para o vídeo substituto.');}if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw fail('Use um link HTTP ou HTTPS para o vídeo.');}
 return keys;
}
export async function saveReview(body,transport={read:readReviewData,write:(payload)=>sheets('/values:batchUpdateByDataFilter',{method:'POST',body:JSON.stringify(payload)})},access) {
 const keys=validatePatch(body),data=await transport.read(),row=data.rows.find(r=>r.id===body.id);
 if(access&&!canAccessRow(access,row||{}))throw fail('Este exercício está fora da sua faixa de revisão.',403);
 if(!row)throw fail('Este exercício foi removido ou mudou. Atualize a lista.',409);
 for(const key of keys){if(row._cells?.[data.columns[key]]?.userEnteredValue?.formulaValue)throw fail('Este campo contém uma fórmula. Edite pela planilha.',409);}
 const current=Object.fromEntries(EDITABLE.map(key=>[key,row[key]]));
 const filled=EDITABLE.some(key=>(key==='validated'||key==='rejected')?row[key]===true:row[key].trim()!=='');
 const changed=EDITABLE.some(key=>Object.hasOwn(body.base,key)&&row[key]!==body.base[key]);
 const confirmed=body.confirmed&&EDITABLE.every(key=>Object.hasOwn(body.confirmed,key)&&body.confirmed[key]===row[key]);
 if((filled||changed||body.confirmed)&&!confirmed){
  throw Object.assign(fail('Já existem dados preenchidos ou alterados na planilha. Deseja reescrever os campos que você editou?',409),{code:'REVIEW_CONFIRMATION_REQUIRED',current});
 }
 const values=Array(Math.max(...keys.map(k=>data.columns[k]),...(access?[data.columns.updatedBy]:[]))+1).fill(null);
 if(access){if(row._cells?.[data.columns.updatedBy]?.userEnteredValue?.formulaValue)throw fail('A coluna Alterado por contém uma fórmula. Edite pela planilha.',409);values[data.columns.updatedBy]=access.name;}
 for(const key of keys)values[data.columns[key]]=body.patch[key];
 const result=await transport.write({valueInputOption:'RAW',data:[{dataFilter:{developerMetadataLookup:{metadataId:body.id}},majorDimension:'ROWS',values:[values]}]});
 if(result.totalUpdatedRows!==1)throw fail('Não foi possível confirmar a gravação. Atualize a lista.',502);
 const verified=(await transport.read()).rows.find(r=>r.id===body.id);
 if(!verified||keys.some(k=>verified[k]!==body.patch[k])||(access&&verified.updatedBy!==access.name))throw fail('A gravação não foi confirmada ou houve uma edição simultânea. Atualize a lista.',409);
 return publicRow(verified);
}
