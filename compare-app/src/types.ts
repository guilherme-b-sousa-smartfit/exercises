export type Confidence = "A" | "B" | "C" | "-";

export type Enrichment = {
  id: string;
  name: string;
  conf: Confidence;
  image: string;
  gif: string;
};

export type EnrichmentMap = Record<string, Enrichment>;

export type ExerciseRow = {
  key: string;
  linha: number;
  name: string;
  imageUrl: string;
  gifUrl: string;
  gifSugerido: string;
  origem: string;
  licenca: string;
  datasetId: string;
  datasetName: string;
  confidence: Confidence;
  inImageTab: boolean;
  inVideoTab: boolean;
  duplicado: boolean;
  coverage: Coverage;
};

export type SheetState = {
  rows: ExerciseRow[];
  loading: boolean;
  error: string | null;
  fetchedAt: Date | null;
};

export type Coverage = "completo" | "so-thumb" | "so-gif" | "nenhum";

export type StatusFilter = "todos" | Coverage;

export type Filters = {
  search: string;
  status: StatusFilter;
  confidences: Confidence[];
  origens: string[];
};

export type Totals = Record<Coverage, number> & { total: number };

export type OrigemContagem = {
  origem: string;
  total: number;
};
