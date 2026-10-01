import {useCallback,useEffect,useRef,useState} from 'react';
export type ReviewAccess={id:string;name:string;startRow:number|null;endRow:number|null};
export type ReviewFields={validated:boolean;rejected:boolean;comments:string;replacementTitle:string;replacementVideo:string};
export type ReviewRow=ReviewFields&{id:number|null;order:number;rowNumber:number;name:string;smartVideo:string;gymNamePt:string;gymName:string;gymVideo:string;score:number;updatedBy?:string};
export const reviewFields=(r:ReviewFields):ReviewFields=>({validated:r.validated,rejected:r.rejected??false,comments:r.comments,replacementTitle:r.replacementTitle,replacementVideo:r.replacementVideo});
export async function request<T>(path:string,options:RequestInit={}):Promise<T>{const r=await fetch(`/api/${path}`,{...options,cache:'no-store',headers:{'Content-Type':'application/json',...options.headers}});let body;try{body=await r.json();}catch{throw new Error('A conexão com a planilha não está disponível.');}if(!r.ok)throw Object.assign(new Error(body.error||'Não foi possível concluir a operação.'),{status:r.status,code:body.code,current:body.current});return body;}
export function useReviewSheet(){
 const [rows,setRows]=useState<ReviewRow[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[canEdit,setCanEdit]=useState(false),[updatedAt,setUpdatedAt]=useState('');
 const [access,setAccess]=useState<ReviewAccess|null>(null);
 const controller=useRef<AbortController>();
 const reload=useCallback(async()=>{controller.current?.abort();const c=new AbortController();controller.current=c;
  try{const result=await request<{rows:ReviewRow[];canEdit:boolean;access:ReviewAccess|null;updatedAt:string}>('reviews',{signal:c.signal});if(!c.signal.aborted){setRows(result.rows);setAccess(result.access);setCanEdit(result.canEdit);setUpdatedAt(result.updatedAt);setError('');}}
  catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'Falha ao atualizar a planilha.');}finally{if(!c.signal.aborted)setLoading(false);}
 },[]);
 useEffect(()=>{void reload();return()=>controller.current?.abort();},[reload]);
 const save=async(id:number,base:ReviewFields,values:ReviewFields,confirmed?:ReviewFields)=>{const patch:Partial<ReviewFields>={};for(const k of Object.keys(values) as (keyof ReviewFields)[])if(values[k]!==base[k])Object.assign(patch,{[k]:values[k]});if(!Object.keys(patch).length)return;
  try{const {row}=await request<{row:ReviewRow}>('reviews',{method:'PATCH',body:JSON.stringify({id,base,patch,confirmed})});setRows(rs=>rs.map(r=>r.id===row.id?row:r));setUpdatedAt(new Date().toISOString());}catch(e){if((e as {status?:number}).status===401)setCanEdit(false);throw e;}
 };
 const login=async(password:string)=>{controller.current?.abort();setRows([]);const result=await request<{access:ReviewAccess}>('session',{method:'POST',body:JSON.stringify({password})});setAccess(result.access);setCanEdit(true);await reload();};
 const logout=async()=>{await request('session',{method:'DELETE'});controller.current?.abort();setCanEdit(false);setAccess(null);setRows([]);};
 const acceptCurrent=(id:number,current:ReviewFields)=>{setRows(rs=>rs.map(r=>r.id===id?{...r,...current}:r));};
 return {rows,loading,error,canEdit,access,updatedAt,reload,save,login,logout,acceptCurrent};
}
