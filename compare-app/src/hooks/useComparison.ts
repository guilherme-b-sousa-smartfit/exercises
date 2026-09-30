import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchComparison, fetchSnapshot, type ComparisonRow } from '../lib/comparison';
export function useComparison() {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const request = useRef<AbortController>();
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setLoading(true); setError('');
    try {
      const saved = await fetchSnapshot(controller.signal);
      const live = saved.rows;
      if (!controller.signal.aborted) { setRows(live); setSource(`Análise atualizada · ${saved.date}`); }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Falha ao carregar a análise.';
      try {
        const saved = { rows: await fetchComparison(controller.signal), date: "planilha de referência" };
        if (!controller.signal.aborted) {
          setRows(saved.rows); setSource(`Fonte alternativa · ${saved.date}`);
          setError(`${message} Exibindo a planilha de referência; as pontuações sem análise correspondente ficam em 0%.`);
        }
      } catch {
        if (!controller.signal.aborted) setError(`${message} A planilha de referência também está indisponível.`);
      }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void reload(); return () => request.current?.abort(); }, [reload]);
  return { rows, loading, error, source, reload };
}
