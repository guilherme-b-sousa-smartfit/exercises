"""Compare Smart Fit names to the bounded public ExerciseAPI demo sample."""
import collections, datetime, json
from build_comparison import ROOT, canonical
from build_musclewiki_comparison import match

def build():
    data = json.loads((ROOT/'out/comparativo/exerciseapi-demo.json').read_text())
    base = json.loads((ROOT/'compare-app/public/comparison.json').read_text())
    equipment = {'body only':'Body weight','machine':'Leverage machine','cable':'Cable','dumbbell':'Dumbbell','barbell':'Barbell','bands':'Band'}
    catalog = [{**e, '_canon':canonical(e['name']), 'equipment':equipment.get(e.get('equipment'),e.get('equipment') or '')} for e in data['exercises']]
    h = base['headers']
    rows = []
    for r in base['values']:
        eid,name,group = [str(r[h.index(k)]).strip() for k in ['ID base','Exercício base','Grupo base']]
        result=match(name,group,catalog)
        result['reason']=result['reason'].replace('normalização dos termos em português','tradução e normalização')
        rows.append({'id':eid,'name':name,'group':group,**result})
    result={**data,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rows':rows,'counts':dict(collections.Counter(r['status'] for r in rows))}
    (ROOT/'compare-app/public/exerciseapi-comparison.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
    print(json.dumps({'sample':len(catalog),**result['counts']},ensure_ascii=False))
if __name__=='__main__': build()
