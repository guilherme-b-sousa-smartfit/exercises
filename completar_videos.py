import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

SID = "121GJz4mJA2QvrG2iML0AwKuKW_Szgt2PqxYKn2Lg44s"
BASE = "/Users/guibais/Documents/smartfit/exercises/out"

cred = service_account.Credentials.from_service_account_file(
    "/Users/guibais/.config/claude-sheets-sa.json",
    scopes=["https://www.googleapis.com/auth/spreadsheets"])
svc = build("sheets", "v4", credentials=cred).spreadsheets()

dataset = json.load(open(f"{BASE}/mapa.json", encoding="utf-8"))
externa = json.load(open(f"{BASE}/midia-externa.json", encoding="utf-8"))

abas = sorted(svc.get(spreadsheetId=SID, fields="sheets.properties(title,index)").execute()["sheets"],
              key=lambda s: s["properties"]["index"])
aba_img, aba_vid = (a["properties"]["title"] for a in abas[:2])
q = lambda t: "'" + t.replace("'", "''") + "'"

nomes_img = [r[0].strip() for r in svc.values().get(
    spreadsheetId=SID, range=f"{q(aba_img)}!A:A").execute().get("values", []) if r and r[0].strip()]
nomes_vid = [r[0].strip() for r in svc.values().get(
    spreadsheetId=SID, range=f"{q(aba_vid)}!A:A").execute().get("values", []) if r and r[0].strip()]

def gif_de(nome):
    do_dataset = dataset.get(nome, {}).get("gif", "")
    if do_dataset:
        return do_dataset, ""
    ext = externa.get(nome)
    if ext and ext["gif"]:
        return ext["gif"], f"{ext['origem']} · {ext['licenca']}"
    return "", ""

ja = set(nomes_vid)
vistos = set()
faltantes = []
for nome in nomes_img:
    if nome in ja or nome in vistos:
        continue
    vistos.add(nome)
    url, flag = gif_de(nome)
    if url:
        faltantes.append([nome, url, flag])

if not faltantes:
    print("nada a inserir")
    raise SystemExit

print(f"aba '{aba_vid}': {len(nomes_vid)} linhas | inserindo {len(faltantes)}:")
for n, u, _ in faltantes:
    print(f"   + {n}\n       {u}")

res = svc.values().append(
    spreadsheetId=SID,
    range=f"{q(aba_vid)}!A:C",
    valueInputOption="RAW",
    insertDataOption="INSERT_ROWS",
    body={"values": faltantes},
).execute()
print("\nescrito em:", res["updates"]["updatedRange"], "| células:", res["updates"]["updatedCells"])
