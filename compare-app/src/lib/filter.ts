import type {
  Coverage,
  ExerciseRow,
  Filters,
  OrigemContagem,
  StatusFilter,
  Totals,
} from "../types";

export const coverageOf = (imageUrl: string, gifUrl: string): Coverage => {
  if (imageUrl && gifUrl) return "completo";
  if (imageUrl) return "so-thumb";
  if (gifUrl) return "so-gif";
  return "nenhum";
};

export const COVERAGE_ROTULO: Record<Coverage, string> = {
  completo: "thumbnail + GIF",
  "so-thumb": "só thumbnail",
  "so-gif": "só GIF",
  nenhum: "sem mídia",
};

const STATUS_TEST: Record<StatusFilter, (row: ExerciseRow) => boolean> = {
  todos: () => true,
  completo: (row) => row.coverage === "completo",
  "so-thumb": (row) => row.coverage === "so-thumb",
  "so-gif": (row) => row.coverage === "so-gif",
  nenhum: (row) => row.coverage === "nenhum",
};

const DIACRITICS = /[\u0300-\u036f]/g;

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(DIACRITICS, "");

export const applyFilters = (rows: ExerciseRow[], filters: Filters) => {
  const term = normalize(filters.search.trim());

  return rows.filter((row) => {
    if (!STATUS_TEST[filters.status](row)) return false;
    if (filters.origens.length && !filters.origens.includes(row.origem)) return false;
    if (filters.confidences.length && !filters.confidences.includes(row.confidence)) return false;
    if (!term) return true;
    return normalize(`${row.name} ${row.datasetName}`).includes(term);
  });
};

export const countTotals = (rows: ExerciseRow[]): Totals =>
  rows.reduce<Totals>(
    (acc, row) => {
      acc[row.coverage] += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, completo: 0, "so-thumb": 0, "so-gif": 0, nenhum: 0 },
  );

export const countExterna = (rows: ExerciseRow[]) => rows.filter((row) => row.origem).length;

export const contarOrigens = (rows: ExerciseRow[]): OrigemContagem[] => {
  const porOrigem = rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.origem) return acc;
    acc[row.origem] = (acc[row.origem] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(porOrigem)
    .map(([origem, total]) => ({ origem, total }))
    .sort((a, b) => b.total - a.total || a.origem.localeCompare(b.origem));
};

export const licencaDe = (rows: ExerciseRow[], origem: string) =>
  [...new Set(rows.filter((row) => row.origem === origem && row.licenca).map((row) => row.licenca))]
    .sort()
    .join(" / ");
