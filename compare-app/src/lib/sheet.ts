import type { EnrichmentMap, ExerciseRow, Confidence } from "../types";
import { coverageOf } from "./filter";

const SHEET_ID = "121GJz4mJA2QvrG2iML0AwKuKW_Szgt2PqxYKn2Lg44s";

export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;

const TABS = { images: "0", videos: "1475028584" } as const;

type Cell = { name: string; url: string; origem: string };

const tabUrl = (gid: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=0&gid=${gid}&cachebust=${Date.now()}`;

export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char !== '"') {
        field += char;
        continue;
      }
      if (text[i + 1] === '"') {
        field += '"';
        i += 1;
        continue;
      }
      quoted = false;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    if (char !== "\r") field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

const fetchTab = async (gid: string): Promise<Cell[]> => {
  const res = await fetch(tabUrl(gid), { cache: "no-store" });
  if (!res.ok) throw new Error(`Planilha respondeu ${res.status}`);

  return parseCsv(await res.text())
    .map((cells) => ({
      name: cells[0]?.trim() ?? "",
      url: cells[1]?.trim() ?? "",
      origem: cells[2]?.trim() ?? "",
    }))
    .filter((cell) => cell.name.length > 0);
};

const countByName = (cells: Cell[]) =>
  cells.reduce<Record<string, number>>((acc, { name }) => {
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});

export const fetchRows = async (enrichment: EnrichmentMap): Promise<ExerciseRow[]> => {
  const [images, videos] = await Promise.all([fetchTab(TABS.images), fetchTab(TABS.videos)]);
  const videoUrl = new Map(videos.map(({ name, url }) => [name, url]));
  const imageUrl = new Map(images.map(({ name, url }) => [name, url]));
  const repetidos = countByName(images);

  const build = (
    name: string,
    image: string,
    gif: string,
    linha: number,
    origem: string,
  ): ExerciseRow => {
    const extra = enrichment[name];
    return {
      key: `${name}#${linha}`,
      linha,
      name,
      imageUrl: image,
      gifUrl: gif,
      gifSugerido: gif ? "" : extra?.gif ?? "",
      origem,
      datasetId: extra?.id ?? "",
      datasetName: extra?.name ?? "",
      confidence: (extra?.conf ?? "-") as Confidence,
      inImageTab: imageUrl.has(name),
      inVideoTab: videoUrl.has(name),
      duplicado: (repetidos[name] ?? 0) > 1,
      coverage: coverageOf(image, gif),
    };
  };

  const origemDe = new Map(
    [...images, ...videos].filter((c) => c.origem).map(({ name, origem }) => [name, origem]),
  );

  const daAba1 = images.map(({ name, url }, i) =>
    build(name, url, videoUrl.get(name) ?? "", i + 1, origemDe.get(name) ?? ""),
  );

  const soNaAba2 = videos
    .filter(({ name }) => !imageUrl.has(name))
    .map(({ name, url }, i) =>
      build(name, "", url, images.length + i + 1, origemDe.get(name) ?? ""),
    );

  return [...daAba1, ...soNaAba2];
};

export const fetchEnrichment = async (): Promise<EnrichmentMap> => {
  const res = await fetch("mapa.json", { cache: "no-store" });
  if (!res.ok) return {};
  return res.json();
};
