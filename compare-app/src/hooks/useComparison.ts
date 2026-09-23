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
      const live = await fetchComparison(controller.signal);
      if (!controller.signal.aborted) { setRows(live); setSource(`Planilha ao vivo · lida às ${new Date().toLocaleTimeString('pt-BR')}`); }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Falha na leitura ao vivo.';
      try {
        const saved = await fetchSnapshot(controller.signal);
        if (!controller.signal.aborted) {
          setRows(saved.rows); setSource(`Cópia salva da análise de ${saved.date}`);
          setError(`${message} Exibindo a cópia salva, que pode não refletir alterações na planilha.`);
        }
      } catch {
        if (!controller.signal.aborted) setError(`${message} A cópia salva também está indisponível.`);
      }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { void reload(); return () => request.current?.abort(); }, [reload]);
  return { rows, loading, error, source, reload };
}
