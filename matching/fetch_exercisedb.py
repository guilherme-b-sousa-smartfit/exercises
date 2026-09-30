"""Read the public OSS API sequentially; retain metadata and source GIF URLs, not media files."""
import datetime, json, time, subprocess, tempfile
from pathlib import Path
from urllib.parse import urlencode
ROOT = Path(__file__).resolve().parents[1]

def fetch():
    checkpoint = ROOT / 'out/comparativo/exercisedb-checkpoint.json'
    saved = json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
    rows, cursor = saved.get('rows', []), saved.get('cursor')
    seen = {r['exerciseId'] for r in rows}
    while True:
        params = {'limit': 25}
        if cursor: params['after'] = cursor
        url = 'https://oss.exercisedb.dev/api/v1/exercises?' + urlencode(params)
        for attempt in range(4):
            with tempfile.NamedTemporaryFile() as body, tempfile.NamedTemporaryFile() as headers:
                status = subprocess.check_output(['curl', '--silent', '--show-error', '--max-time', '30', '-D', headers.name, '-o', body.name, '-w', '%{http_code}', url], text=True)
                if status == '429':
                    wait = 60
                    for line in Path(headers.name).read_text().splitlines():
                        if line.lower().startswith('retry-after:') and line.split(':', 1)[1].strip().isdigit():
                            wait = max(wait, int(line.split(':', 1)[1].strip()))
                    print(f'Rate limit: waiting {wait}s', flush=True)
                    time.sleep(wait)
                    continue
                if status != '200': raise ValueError('API HTTP ' + status)
                data = json.loads(Path(body.name).read_text())
                break
        else: raise ValueError('Rate limit persists; resume from checkpoint later')
        if data.get('success') is not True or not isinstance(data.get('data'), list):
            raise ValueError('Unexpected API response; previous snapshot preserved')
        for row in data['data']:
            if row['exerciseId'] in seen: raise ValueError('Duplicate ID / pagination loop')
            seen.add(row['exerciseId']); rows.append(row)
        meta = data['meta']
        print(f"{len(rows)}/{meta['total']}", flush=True)
        if not meta['hasNextPage']: break
        next_cursor = meta.get('nextCursor')
        if not next_cursor or next_cursor == cursor: raise ValueError('Invalid pagination cursor')
        cursor = next_cursor
        checkpoint.write_text(json.dumps({'rows': rows, 'cursor': cursor}))
        time.sleep(5)
    if len(rows) != meta['total']: raise ValueError('Incomplete catalog; previous snapshot preserved')
    output = ROOT / 'out/comparativo/exercisedb-catalog.json'
    output.write_text(json.dumps({'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'source': 'https://oss.exercisedb.dev/api/v1/exercises', 'attribution': 'AscendAPI — https://ascendapi.com', 'total': len(rows), 'exercises': rows}, ensure_ascii=False, indent=2))
    checkpoint.unlink(missing_ok=True)

if __name__ == '__main__': fetch()
