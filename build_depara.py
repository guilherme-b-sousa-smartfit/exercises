import csv, json, os

REPO = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main"
DATASET = "/tmp/exdata/data/exercises.json"
OUT = "/Users/guibais/Documents/smartfit/exercises/out"

MAP = {
    "Supino Fechado": ("0030", "A"),
    "Abdominal Máquina Hammer": ("0595", "A"),
    "Remada Polia Triângulo Sentada": ("0213", "A"),
    "Remada Polia Barra Reta Fechada Sentada": ("0861", "B"),
    "Remada Polia Barra Reta Aberta Sentada": ("0239", "B"),
    "Remada Polia Barra Reta Supinada Sentada": ("0208", "B"),
    "Gêmeos Sentado Unilateral": ("0400", "B"),
    "Rosca Barra W Alta": ("0447", "B"),
    "Rolinho de Joelhos com TRX'": ("0805", "A"),
    "Supino Freemotion": ("2144", "B"),
    "Supino Livre Declinado": ("0033", "A"),
    "Remada Freemotion": ("0234", "B"),
    "Abdominal Supra Freemotion": ("0226", "B"),
    "Agachamento + Desenvolvimento Fechado Alternado com Halter": ("0550", "C"),
    "Stiff + Remada Alta com Halter": ("1459", "C"),
    "Rosca 45 no Step'": ("0318", "A"),
    "Ondas Alternado Sentado": ("0128", "B"),
    "Flexão do Joelho Deitado com Bola": ("1417", "B"),
    "Elevação Pélvica com Barra e Step'": ("1409", "A"),
    "Flexão de joelho unilateral com caneleira": ("0795", "B"),
    "Agachamento Hack Inclinado": ("0743", "A"),
    "Cadeira Extensora Articulada": ("0585", "A"),
    "Agachamento com Cinto Articulado": (None, "-"),
    "Agachamento Pêndulo": (None, "-"),
    "Afundo Articulado": ("0768", "C"),
    "Supino Reto Articulado": ("0577", "A"),
    "Remada Baixa Articulada": ("1350", "A"),
    "Supino Reto Deitado Articulado": ("0576", "B"),
    "Supino Inclinado Deitado Articulado": ("1299", "A"),
    "Desenvolvimento Articulado": ("0603", "A"),
    "Remada Cavalinho com Suporte": ("0606", "A"),
    "Agachamento Unilateral Hack Inclinado": ("0743", "C"),
    "Cadeira Extensora Articulada Unilateral": ("0585", "C"),
    "Agachamento Sumô com Cinto Articulado": ("3142", "C"),
    "Agachamento Sissy": ("1489", "A"),
    "Supino Reto Articulado Unilateral": ("0577", "C"),
    "Remada Baixa Articulada Fechada": ("0588", "A"),
    "Remada Baixa Articulada Fechada Unilateral": ("0571", "B"),
    "Remada Baixa Articulada Supinada": ("1348", "B"),
    "Remada Baixa Articulada Supinada Unilateral": ("1313", "C"),
    "Supino Reto Deitado Articulado Unilateral": ("0576", "C"),
    "Supino Inclinado Deitado Articulado Unilateral": ("1479", "C"),
    "Desenvolvimento Articulado Unilateral": ("0590", "A"),
    "Hiperextensão Máquina": ("0573", "A"),
    "Abdução em pé Máquina": ("0597", "C"),
    "Elevação Pelvica em Pé Articulada": ("2286", "B"),
    "Remada Alta Articulada Supinada": ("0775", "C"),
    "Leg Press Horizontal Unilateral Articulado": ("2611", "A"),
    "Agachamento Articulado": ("0770", "B"),
    "Elevação Pélvica Máquina": ("2286", "B"),
    "Hiperextensão Reversa": ("0593", "A"),
    "Crucifixo Estação Múltipla": ("0188", "A"),
    "Crucifixo Inverso Estação Multi": ("0154", "A"),
    "Elevação Lateral Estação Multi": ("0178", "A"),
    "Remada 45 Guiada": ("1359", "A"),
    "Elevação Lateral Articulada": ("0584", "A"),
    "Cadeira Abdutora Articulada": ("0597", "A"),
    "Toque de escapula no chão": ("3239", "A"),
    "Agachamento com mãos no tornozelo": ("3119", "C"),
    "Afundo com rotação de tronco": ("1688", "A"),
    "Sustentação plante flexão tornozelo": ("1387", "C"),
    "Sustentação no tornozelo": ("1368", "C"),
    "Escorpião": ("3639", "B"),
    "Circundução de ombro": (None, "-"),
    "Circundução de punho": ("1428", "A"),
    "Gato": ("1363", "C"),
    "Abdução de quadril com elástico": ("3006", "B"),
    "Elevação Pélvica Mobilidade": ("3013", "A"),
    "Elevação Pélvica Unilateral Mobilidade": ("3645", "A"),
    "Perdigueiro Alternado": ("0276", "C"),
    "Rotação de Tronco Tocando os pés": ("1468", "B"),
    "Semi Ajoelhado Anteorização de Joelho": (None, "-"),
    "Semi Ajoelhado Anteorização Extenção": (None, "-"),
    "Semi Ajoelhado Abdução Lateralização": (None, "-"),
    "Semi Ajoelhado Abdução de Ombros": (None, "-"),
    "Semi Ajoelhado Rotação de Tronco": (None, "-"),
    "Semi Ajoelhado Anteorização de Joelho 2 lados": (None, "-"),
    "Semi Ajoelhado Perna Oposta Estendida": (None, "-"),
    "Semi Ajoelhado Perna Oposta Estendida Tronco": (None, "-"),
    "Saudação ao Sol": (None, "-"),
    "Rotação Tronco 6 apoios Braços Estendidos": ("2329", "C"),
    "Rotação Interna e Externa de Quadril": ("0996", "B"),
    "Rotação Interna e Externa de Quadril com subida": ("0984", "C"),
    "Rotação de Quadril Perna Estendida": ("1416", "C"),
    "Rotação de Tronco 6 apoios Braço Occipital": ("2329", "C"),
    "Flexão de Quadril e Extensão de Quadril": ("1564", "C"),
    "Flexão e Extensão de Punho": ("1428", "C"),
    "Agachamento Profundo isométrico": ("3119", "C"),
    "Agachamento Profundo com Balanço": ("3132", "C"),
    "Circundação de Ombro Tocando Calcanhar": (None, "-"),
    "Circundação de Tornozelo": ("1368", "A"),
    "Reverência isométrico": ("3769", "B"),
    "Crucifixo Inclinado Articulado": ("0596", "B"),
    "Elevação Lateral Unilateral Articulada": ("0584", "C"),
    "Supino Guiado Declinado": ("0753", "A"),
    "Supino Guiado Unilateral Declinado": ("0753", "C"),
    "Supino Guiado Reto": ("0748", "A"),
    "Supino Guiado Unilateral Reto": ("0748", "C"),
    "Tríceps Paralela Articulado": ("1451", "A"),
    "Rosca Scott Articulado": ("0592", "A"),
    "Agachamento Articulado Invertido": ("0744", "C"),
    "Desenvolvimento Guiado": ("0766", "A"),
    "Elevação Pélvica Guiada": ("0756", "B"),
    "Flexão Nortica Articulada": ("0496", "A"),
    "Squat Power": ("0770", "C"),
    "Gluteo Coice Articulado": ("2286", "B"),
    "Gluteo Coice Máquina": ("2286", "B"),
    "Stiff no Hiperextensão Máquina": ("0573", "C"),
    "Cadeira Abdutora 3D": ("0597", "C"),
    "Subida Máquina": ("0431", "C"),
    "Supino Inclinado Guiado": ("0757", "A"),
    "Glúteo Coice": ("0130", "B"),
    "Glúteo Polia (perna estendida)": ("0228", "A"),
    "Elevação Pelvica em Pé Máquina": ("2286", "B"),
    "Leg Press 90 no Smith": ("0760", "A"),
    "Esteira": ("3666", "A"),
    "Bicicleta": ("2138", "A"),
    "Escada": ("2311", "A"),
    "Elíptico": ("2141", "A"),
    "Corrida na Rua": ("0685", "A"),
    "Bicicleta na Rua": ("2138", "C"),
    "Natação": (None, "-"),
}

HIT = {"": ("3666", "C"), "BIKE": ("2138", "C"), "ELÍPTICO": ("2141", "C")}

def resolve(name):
    if name in MAP:
        return MAP[name]
    if name.upper().startswith("HIT"):
        suffix = name.split(" - ")[1].strip().upper() if " - " in name else ""
        return HIT.get(suffix, (None, "-"))
    return (None, "?")

ds = {e["id"]: e for e in json.load(open(DATASET, encoding="utf-8"))}

def read_tab(path):
    return [r[0].strip() for r in csv.reader(open(path, encoding="utf-8")) if r and r[0].strip()]

report = []
for tab, path, field in (("aba1_imagens", "/tmp/sheet1.csv", "image"), ("aba2_videos", "/tmp/sheet2.csv", "gif_url")):
    names = read_tab(path)
    col, full = [], []
    for n in names:
        eid, conf = resolve(n)
        url = f"{REPO}/{ds[eid][field]}" if eid else ""
        col.append([url])
        full.append([n, url, eid or "", ds[eid]["name"] if eid else "", ds[eid]["equipment"] if eid else "", conf])
        if tab == "aba1_imagens":
            report.append(full[-1])
    with open(f"{OUT}/{tab}_colunaB.csv", "w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(col)
    with open(f"{OUT}/{tab}_conferencia.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["exercicio_smartfit", "url", "dataset_id", "dataset_name", "equipment", "confianca"])
        w.writerows(full)
    print(f"{tab}: {len(names)} linhas, {sum(1 for r in full if r[1])} preenchidas, {sum(1 for r in full if not r[1])} vazias")

with open(f"{OUT}/mapa.json", "w", encoding="utf-8") as f:
    json.dump({r[0]: {"id": r[2], "name": r[3], "conf": r[5],
                      "image": f"{REPO}/{ds[r[2]]['image']}" if r[2] else "",
                      "gif": f"{REPO}/{ds[r[2]]['gif_url']}" if r[2] else ""} for r in report},
              f, ensure_ascii=False, indent=2)

from collections import Counter
print("confianca:", dict(Counter(r[5] for r in report)))
