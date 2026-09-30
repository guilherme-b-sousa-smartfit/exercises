"""Persist explicitly supplied visual-review decisions against exact observed pairs.
Usage: python matching/record_visual_review.py 0 '90,70,...' [--reason '...']
Each batch refers to one extracted contact sheet. Scores require actual inspection.
Use x for missing/unreadable frames; these remain title-only.
"""
import argparse, datetime, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 p=argparse.ArgumentParser();p.add_argument('offset',type=int);p.add_argument('scores');p.add_argument('--reason');a=p.parse_args()
 pairs=json.loads((ROOT/'out/visual-review/pairs.json').read_text())
 values=a.scores.split(',');batch=pairs[a.offset:a.offset+20]
 assert len(values)==len(batch),(len(values),len(batch))
 dest=ROOT/'compare-app/public/visual-reviews.json'; reviews=json.loads(dest.read_text()) if dest.exists() else {}
 for pair,value in zip(batch,values):
  if value.strip()=='x': continue
  score=int(value);assert 0<=score<=100
  assert pair.get('sourceFrame') and pair.get('targetFrame'),pair['id']
  explanation = 'Postura, apoio e equipamento compatíveis no frame observado; amplitude e sequência completas não verificadas.' if score>=85 else 'Mesma família de exercício, com diferenças ou incertezas visíveis de apoio, equipamento, pegada ou execução.' if score>=60 else 'Diferenças relevantes de movimento, postura, apoio ou equipamento; baixa equivalência visual.'
  reviews[pair['id']]={k:pair[k] for k in ['name','candidateId','source','target','sourceFrame','targetFrame']}
  reviews[pair['id']].update(score=score,reason=a.reason or explanation,reviewedAt=datetime.date.today().isoformat(),frameSeconds=1)
 dest.write_text(json.dumps(reviews,ensure_ascii=False,indent=2))
 print(len(reviews),'pares revisados')
if __name__=='__main__': main()
