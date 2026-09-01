import json, os, urllib.parse, urllib.request

SHEET_ID = "121GJz4mJA2QvrG2iML0AwKuKW_Szgt2PqxYKn2Lg44s"
TOKEN_PATH = os.path.expanduser("~/.config/claude-sheets-token.json")
MAPA = "/Users/guibais/Documents/smartfit/exercises/out/mapa.json"
API = "https://sheets.googleapis.com/v4/spreadsheets"


def token():
    c = json.load(open(TOKEN_PATH))
    body = urllib.parse.urlencode({
        "client_id": c["client_id"], "client_secret": c["client_secret"],
        "refresh_token": c["refresh_token"], "grant_type": "refresh_token",
    }).encode()
    return json.load(urllib.request.urlopen("https://oauth2.googleapis.com/token", body))["access_token"]


def call(tok, path, method="GET", payload=None):
    req = urllib.request.Request(
        f"{API}/{SHEET_ID}{path}",
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
        method=method,
    )
    return json.load(urllib.request.urlopen(req))


def quote(title):
    return "'" + title.replace("'", "''") + "'"


tok = token()
meta = call(tok, "?fields=sheets.properties(title,sheetId,index)")
abas = sorted(meta["sheets"], key=lambda s: s["properties"]["index"])
media = json.load(open(MAPA, encoding="utf-8"))
campos = ["image", "gif"]

data, resumo = [], []
for i, aba in enumerate(abas[:2]):
    title = aba["properties"]["title"]
    vals = call(tok, f"/values/{urllib.parse.quote(quote(title) + '!A:A')}").get("values", [])
    nomes = [(r[0].strip() if r else "") for r in vals]
    col = [[media.get(n, {}).get(campos[i], "")] for n in nomes]
    data.append({"range": f"{quote(title)}!B1:B{len(col)}", "values": col})
    resumo.append((title, len(col), sum(1 for c in col if c[0])))

res = call(tok, "/values:batchUpdate", "POST",
           {"valueInputOption": "RAW", "data": data})

for (title, total, cheias), upd in zip(resumo, res["responses"]):
    print(f"aba '{title}': {total} linhas lidas, {cheias} URLs, {upd['updatedCells']} celulas escritas em B")
print("total de celulas atualizadas:", res["totalUpdatedCells"])
