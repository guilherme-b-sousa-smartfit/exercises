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
CAMPO = ["image", "gif"]

abas = sorted(svc.get(spreadsheetId=SID, fields="sheets.properties(title,index)").execute()["sheets"],
              key=lambda s: s["properties"]["index"])

data, resumo = [], []
for i, aba in enumerate(abas[:2]):
    titulo = aba["properties"]["title"]
    q = "'" + titulo.replace("'", "''") + "'"
    linhas = svc.values().get(spreadsheetId=SID, range=f"{q}!A:A").execute().get("values", [])
    nomes = [(r[0].strip() if r else "") for r in linhas]

    saida, novos = [], 0
    for nome in nomes:
        do_dataset = dataset.get(nome, {}).get(CAMPO[i], "")
        if do_dataset:
            saida.append([do_dataset, ""])
            continue
        ext = externa.get(nome)
        url = ext[CAMPO[i]] if ext else ""
        flag = f"{ext['origem']} · {ext['licenca']}" if ext and url else ""
        if url:
            novos += 1
        saida.append([url, flag])

    data.append({"range": f"{q}!B1:C{len(saida)}", "values": saida})
    resumo.append((titulo, len(saida), sum(1 for r in saida if r[0]), novos))

res = svc.values().batchUpdate(
    spreadsheetId=SID, body={"valueInputOption": "RAW", "data": data}).execute()

for (titulo, total, cheias, novos), upd in zip(resumo, res["responses"]):
    print(f"aba '{titulo}': {total} linhas | {cheias} com mídia ({novos} de fonte externa) | {upd['updatedCells']} células")
print("total atualizado:", res["totalUpdatedCells"])
