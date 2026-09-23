"""Preenche apenas células vazias das abas novas; --aplicar grava a prévia."""
import argparse
import json
from pathlib import Path

SID = "1c_ulTtcGmcryAzIyGT3bgavB8tU95W_WhKtu9f6VNRc"
BASE = Path(__file__).resolve().parent
TABS = {"thumbnail": (33249298, "image"), "videos": (908896634, "gif")}


def planejar(titulo, linhas, mapa):
    sheet_id, campo = TABS[titulo]
    requests = []
    for i, linha in enumerate(linhas):
        nome = str(linha[0]).strip() if linha else ""
        if not nome or (i == 0 and nome == "Exercicio"):
            continue
        # Existing URLs/formulas are user-owned; preserve their provenance too.
        if len(linha) > 1 and linha[1]:
            continue
        item = mapa.get(nome, {})
        url = item.get(campo, "")
        note = item.get(f"{campo}_note", item.get("note", "Mídia não mapeada."))
        origem = item.get(f"{campo}_origem", item.get("origem", ""))
        licenca = item.get(f"{campo}_licenca", item.get("licenca", ""))
        fonte = item.get(f"{campo}_source", item.get("source", ""))
        conf = item.get(f"{campo}_conf", item.get("conf", "-"))
        if url:
            note = f"Confiança {conf}. {note}\nFonte: {fonte}"
        else:
            note = f"Pendente: sem {'thumbnail estática' if campo == 'image' else 'vídeo/GIF'} para esta execução. {note}"
        cell = {"note": note}
        if url:
            cell["userEnteredValue"] = {"stringValue": url}
        requests.append({"updateCells": {
            "range": {"sheetId": sheet_id, "startRowIndex": i, "endRowIndex": i + 1,
                      "startColumnIndex": 1, "endColumnIndex": 2},
            "rows": [{"values": [cell]}],
            "fields": "userEnteredValue,note" if url else "note",
        }})
        if url and origem and not (len(linha) > 2 and linha[2]):
            requests.append({"updateCells": {
                "range": {"sheetId": sheet_id, "startRowIndex": i, "endRowIndex": i + 1,
                          "startColumnIndex": 2, "endColumnIndex": 3},
                "rows": [{"values": [{"userEnteredValue": {
                    "stringValue": f"{origem} · {licenca}"}}]}],
                "fields": "userEnteredValue",
            }})
    return requests


def main():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--aplicar", action="store_true")
    args = parser.parse_args()
    cred = service_account.Credentials.from_service_account_file(
        str(Path.home() / ".config/claude-sheets-sa.json"),
        scopes=["https://www.googleapis.com/auth/spreadsheets"])
    svc = build("sheets", "v4", credentials=cred).spreadsheets()
    meta = svc.get(spreadsheetId=SID, fields="sheets.properties").execute()
    props = {s["properties"]["title"]: s["properties"] for s in meta["sheets"]}
    mapa = json.loads((BASE / "out/mapa-v2.json").read_text())
    requests = []
    for titulo, (sheet_id, _) in TABS.items():
        assert props[titulo]["sheetId"] == sheet_id, "Aba de destino mudou"
        a1 = f"'{titulo}'!A1:C{props[titulo]['gridProperties']['rowCount']}"
        grid = svc.get(spreadsheetId=SID, ranges=[a1], includeGridData=True,
                       fields="sheets.data.rowData.values(userEnteredValue,dataValidation)").execute()
        cells = [r.get("values", []) for s in grid.get("sheets", [])
                 for d in s.get("data", []) for r in d.get("rowData", [])]
        assert not any(c.get("dataValidation") for r in cells for c in r[1:3]), "Revisar validação antes de escrever"
        linhas = [[next(iter(c.get("userEnteredValue", {}).values()), "") for c in r] for r in cells]
        requests.extend(planejar(titulo, linhas, mapa))
    preview = BASE / "out/planilha-v2-requests.json"
    preview.write_text(json.dumps({"requests": requests}, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(requests)} atualizações previstas. Prévia: {preview}")
    if args.aplicar and requests:
        svc.batchUpdate(spreadsheetId=SID, body={"requests": requests}).execute()
        print("Planilha atualizada.")


if __name__ == "__main__":
    main()
