import { useCallback, useEffect, useRef, useState } from "react";
import { fetchEnrichment, fetchRows } from "../lib/sheet";
import type { EnrichmentMap, SheetState } from "../types";

const REFRESH_MS = 30_000;

export const useSheetData = () => {
  const [state, setState] = useState<SheetState>({
    rows: [],
    loading: true,
    error: null,
    fetchedAt: null,
  });
  const enrichment = useRef<EnrichmentMap | null>(null);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      if (!enrichment.current) enrichment.current = await fetchEnrichment();
      const rows = await fetchRows(enrichment.current);
      setState({ rows, loading: false, error: null, fetchedAt: new Date() });
      return;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao ler a planilha",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return { ...state, reload: load };
};
