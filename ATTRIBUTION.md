# Atribuição de mídia

## Lote v2

`out/mapa-v2.json` registra a URL de origem de cada correspondência. O lote novo também
referencia GIFs e imagens diretamente em [Docteur Fitness](https://www.docteur-fitness.com/)
e [FitnessProgramer](https://fitnessprogramer.com/), thumbnails de [Budy](https://budy.fit/)
e prévias públicas com marca d'água do [Gym visual](https://gymvisual.com/).
Não foram espelhados no repositório. As prévias do Gym visual mantêm o aviso de copyright;
nas outras fontes sem licença de reutilização informada, essa condição aparece na coluna C.
As notas da coluna B indicam aproximações, diferenças de execução e a página de origem.
Quando thumbnail e GIF têm fontes diferentes, os campos `image_*` e `gif_*` do mapa
registram fonte, observação e confiança separadamente.

Este repositório espelha mídia de terceiros usada para os exercícios que **não existem** no
dataset [`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset).

A mídia do próprio dataset **não** é espelhada aqui — ela é referenciada direto na origem e é
© [Gym visual](https://gymvisual.com/).

## `midia/`

| Arquivo | Origem | Licença |
|---|---|---|
| `saudacao-ao-sol.gif`, `saudacao-ao-sol-thumb.jpg` | [File:Suryanamaskar.gif](https://commons.wikimedia.org/wiki/File:Suryanamaskar.gif) — Wikimedia Commons | CC BY-SA 3.0 |
| `natacao.gif`, `natacao-thumb.jpg` | [File:Freestyle swimming.gif](https://commons.wikimedia.org/wiki/File:Freestyle_swimming.gif) — Wikimedia Commons | CC BY-SA 4.0 |
| `circunducao-de-ombro.jpg`, `circunducao-de-ombro-thumb.jpg` | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) — `Shoulder_Circles/0.jpg` | Unlicense (domínio público) |
| `circunducao-ombro-calcanhar.jpg`, `circunducao-ombro-calcanhar-thumb.jpg` | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) — `Arm_Circles/0.jpg` | Unlicense (domínio público) |

Os arquivos `*-thumb.jpg` são obras derivadas geradas aqui: um frame do meio do GIF (ou a foto
original), reduzido para 180×180 com fundo branco para casar com o padrão do dataset.

**As duas mídias do Wikimedia Commons são CC BY-SA.** A cláusula share-alike acompanha esses
arquivos e as thumbnails derivadas deles — se você redistribuir, mantenha a atribuição e a mesma
licença. Isso vale para a mídia, não para o código do app neste repositório.
