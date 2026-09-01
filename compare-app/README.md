# De-para de exercícios — app de conferência

Lê a planilha do Google Sheets **ao vivo** no browser (endpoint `gviz`, que devolve
`Access-Control-Allow-Origin`, então não precisa de proxy nem de credencial) e mostra
cada exercício da planilha ao lado da mídia mapeada.

## Rodar

```bash
npm install
npm run dev
```

## O que ele faz

- lê as duas abas (`thumbnail` → imagens, `Videos` → GIFs) e junta por nome
- mostra **thumbnail e GIF lado a lado** em cada card, com a lacuna marcada em amarelo
  quando uma das duas mídias falta; clicar numa mídia abre ela em tamanho real
- revalida sozinho a cada 30s, com botão de recarregar manual
- os números do topo são os filtros de cobertura: **thumbnail + GIF**, **só thumbnail**,
  **só GIF**, **sem mídia** — clique num deles para isolar o grupo
- filtra também por nível de confiança (A / B / C / sem match) e por busca em texto —
  a busca ignora acento, então `gemeos` acha `Gêmeos`
- marca linhas que existem só em uma das abas e nomes duplicados na planilha

Os quatro grupos de cobertura são mutuamente exclusivos e somam o total de linhas.

A ordem e a numeração das linhas espelham a aba 1, inclusive a duplicata de
`Desenvolvimento Guiado` (linhas 102 e 112).

## De onde vem cada dado

| Dado | Origem |
|---|---|
| nome do exercício, URL da mídia | planilha, coluna B, ao vivo |
| flag de fonte externa (`fonte · licença`) | planilha, coluna C, ao vivo |
| nome em inglês, id e confiança do dataset | `public/mapa.json`, gerado por `../build_depara.py` |

Se você regerar o de-para, copie `../out/mapa.json` para `public/mapa.json`.

## Fonte externa

Quando a mídia não vem do dataset do GitHub, a coluna C da planilha traz `fonte · licença`.
Esses cards ganham um badge roxo e o botão **Só fonte externa** isola eles.
