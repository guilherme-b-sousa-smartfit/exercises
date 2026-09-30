"""Extract one real frame per video URL and resumable contact sheets for visual review.
Run after build_comparison and preview collection. No similarity is fabricated here.
"""
import concurrent.futures, hashlib, json, subprocess, argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--limit',type=int); parser.add_argument('--workers',type=int,default=8); args=parser.parse_args()
    directory=ROOT/'out/visual-review'; directory.mkdir(exist_ok=True)
    assets=json.loads((ROOT/'compare-app/public/gymvisual-media.json').read_text())['assets']
    rows=json.loads((ROOT/'out/comparativo/comparison.json').read_text())['rows']
    pairs=[]
    for row in rows:
        candidate=row['media']['video']; asset=assets.get('video:'+candidate['id'],{})
        if row['originalVideo'] and asset.get('previewType')=='video' and asset.get('preview'):
            pairs.append(dict(id=row['id'],name=row['name'],candidate=candidate['name'],candidateId=candidate['id'],source=row['originalVideo'],target=asset['preview'],score=candidate['score']))
    if args.limit: pairs=pairs[:args.limit]
    def path(url): return directory/(hashlib.sha256(url.encode()).hexdigest()[:24]+'.jpg')
    def extract(url):
        destination=path(url)
        if destination.exists(): return url,None
        try:
            result=subprocess.run(['ffmpeg','-loglevel','error','-rw_timeout','10000000','-ss','1','-i',url,'-frames:v','1','-vf','scale=240:220:force_original_aspect_ratio=decrease','-y',str(destination)],capture_output=True,timeout=25)
            if result.returncode or not destination.exists(): return url,'Frame indisponível'
            return url,None
        except subprocess.TimeoutExpired: return url,'Tempo de leitura excedido'
    urls=sorted({p[k] for p in pairs for k in ['source','target']}); failures={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
        for i,(url,error) in enumerate(executor.map(extract,urls)):
            if error: failures[url]=error
            if i%100==0: print(f'{i}/{len(urls)} frames',flush=True)
    font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',14)
    for offset in range(0,len(pairs),20):
        canvas=Image.new('RGB',(2000,1400),'#eeeeee'); draw=ImageDraw.Draw(canvas)
        for i,p in enumerate(pairs[offset:offset+20]):
            x=i%4*500;y=i//4*280
            draw.text((x+4,y+3),p['id']+' '+p['name'][:57],fill='black',font=font)
            draw.text((x+4,y+22),p['candidate'][:62],fill='black',font=font)
            for j,side in enumerate(['source','target']):
                file=path(p[side]);p[side+'Frame']=str(file.relative_to(ROOT)) if file.exists() else None
                if file.exists(): canvas.paste(Image.open(file),(x+4+j*248,y+48))
                else: draw.text((x+4+j*248,y+90),'SEM FRAME',fill='red',font=font)
        canvas.save(directory/f'contact-{offset:04d}.jpg')
    (directory/'pairs.json').write_text(json.dumps(pairs,ensure_ascii=False,indent=2))
    (directory/'failures.json').write_text(json.dumps(failures,indent=2))
    print(f'{len(pairs)} pares; {len(failures)} URLs sem frame',flush=True)
if __name__=='__main__': main()
