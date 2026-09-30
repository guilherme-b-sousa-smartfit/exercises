import { useState } from 'react';
const plans = [{name:'Free',price:0,quota:100,rpm:60},{name:'Starter',price:5,quota:1000,rpm:120},{name:'Pro',price:29,quota:10000,rpm:300},{name:'Business',price:79,quota:100000,rpm:2000}];
export function ExerciseAPICosts() {
  const [name,setName] = useState('Free');
  const [calls,setCalls] = useState(100);
  const plan = plans.find(p=>p.name===name)!;
  const extra = Math.max(0,calls-plan.quota);
  const blocked = calls > plan.quota * (plan.price ? 10 : 1);
  const amount = plan.price + (plan.price ? extra*30*0.002 : 0);
  return <section className="budget-panel" aria-label="Custos ExerciseAPI"><h2>ExerciseAPI · planos e custos</h2><p>USD · preços mensais consultados em 24/09/2026. Cotas diárias, sem acúmulo.</p><div className="linha"><label>Plano <select className="botao" value={name} onChange={e=>setName(e.target.value)}>{plans.map(p=><option key={p.name}>{p.name}</option>)}</select></label><label>Chamadas por dia <input className="botao" type="number" min="0" value={calls} onChange={e=>setCalls(Math.max(0,Math.ceil(Number(e.target.value)||0)))} /></label></div><div className="quotes"><div className="quote"><span>Assinatura</span><strong>US$ {plan.price}/mês</strong><small>{plan.quota.toLocaleString('pt-BR')} chamadas/dia · {plan.rpm}/minuto</small></div><div className="quote"><span>Estimativa · 30 dias com volume constante</span><strong>{blocked ? 'Ultrapassa o limite' : amount.toLocaleString('pt-BR',{style:'currency',currency:'USD'})}</strong><small>Pago: US$ 0,002/chamada excedente; trava em 10× a cota diária. Free bloqueia ao atingir 100/dia.</small></div></div><p className="dica">Free: US$ 0 · 100/dia. Starter: US$ 5 · 1.000/dia. Pro: US$ 29 · 10.000/dia. Business: US$ 79 · 100.000/dia. Enterprise sob consulta. Trial Pro de 14 dias, sem cartão. A API direta requer chave própria; esta análise usa a demo pública. Não foi contratado plano.</p><a className="link" href="https://exerciseapi.dev/#pricing" target="_blank" rel="noreferrer">Preços oficiais ↗</a> · <a className="link" href="https://exerciseapi.dev/llms.txt" target="_blank" rel="noreferrer">Referência da API ↗</a></section>;
}
