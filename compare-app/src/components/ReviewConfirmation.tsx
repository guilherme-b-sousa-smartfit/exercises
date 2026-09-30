import {useEffect,useRef} from 'react';
import type {ReviewFields} from '../hooks/useReviewSheet';
export type ReviewDecision='confirm'|'back'|'discard';
export type ReviewConfirmationData={name:string;rowNumber:number;current:ReviewFields;base:ReviewFields;values:ReviewFields};
const labels:Record<keyof ReviewFields,string>={validated:'Validação',comments:'Comentários',replacementTitle:'Título do vídeo substituto',replacementVideo:'Vídeo substituto'};
const keys=Object.keys(labels) as (keyof ReviewFields)[];
function Value({field,value}:{field:keyof ReviewFields;value:string|boolean}){
 if(field==='validated')return <span className={`review-state ${value?'checked':''}`}>{value?'✓ Validado':'Não validado'}</span>;
 if(!value)return <span className="review-empty">Não preenchido</span>;
 if(field==='replacementVideo'&&/^https?:\/\//i.test(String(value)))return <a href={String(value)} target="_blank" rel="noreferrer">{value} ↗</a>;
 return <span>{value}</span>;
}
export function ReviewConfirmation({data,onDecision}:{data:ReviewConfirmationData;onDecision:(decision:ReviewDecision)=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const changed=keys.filter(key=>data.values[key]!==data.base[key]&&data.values[key]!==data.current[key]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  dialog.current?.showModal();
  return()=>{dialog.current?.close();document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 return <dialog ref={dialog} className="review-confirmation" aria-labelledby="review-confirm-title" aria-describedby="review-confirm-description" onCancel={e=>{e.preventDefault();onDecision('back');}}>
  <header className="review-confirm-header"><div className="review-confirm-eyebrow">REVISÃO DA PLANILHA · LINHA {data.rowNumber}</div><button className="review-confirm-close" aria-label="Fechar confirmação" onClick={()=>onDecision('back')}>×</button><h2 id="review-confirm-title">Confira antes de salvar</h2><p className="review-confirm-name">{data.name}</p><p id="review-confirm-description">Este exercício já tem dados preenchidos ou alterados na planilha. Compare os valores antes de confirmar.</p></header>
  <div className="review-confirm-body"><div className="review-confirm-summary"><span>{changed.length} {changed.length===1?'campo será alterado':'campos serão alterados'}</span><small>Os demais dados serão mantidos.</small></div>
   {keys.map(key=>{const isChanged=changed.includes(key);const next=data.values[key]!==data.base[key]?data.values[key]:data.current[key];return <section className={`review-diff ${isChanged?'changed':''}`} key={key} aria-label={labels[key]}><h3>{labels[key]}<span className="review-diff-badge">{isChanged?'Será alterado':'Sem alteração'}</span></h3><div className="review-diff-values"><div className="review-diff-current"><small>NA PLANILHA AGORA</small><div><Value field={key} value={data.current[key]}/></div></div><div className="review-diff-next"><small>APÓS SALVAR</small><div><Value field={key} value={next}/></div></div></div></section>;})}
  </div>
  <footer className="review-confirm-footer"><p>Voltar mantém seu rascunho. Descartar carrega os dados atuais da planilha.</p><div><button className="review-confirm-discard" onClick={()=>onDecision('discard')}>Descartar alterações</button><button autoFocus className="review-confirm-cancel" onClick={()=>onDecision('back')}>Voltar à edição</button><button className="review-confirm-accept" onClick={()=>onDecision('confirm')}>Confirmar e salvar</button></div></footer>
 </dialog>;
}
