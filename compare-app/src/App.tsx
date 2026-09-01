import { useMemo, useState } from "react";
import { StatsBar } from "./components/StatsBar";
import { Toolbar } from "./components/Toolbar";
import { OriginFilter } from "./components/OriginFilter";
import { ExerciseGrid } from "./components/ExerciseGrid";
import { useSheetData } from "./hooks/useSheetData";
import { applyFilters, contarOrigens, licencaDe, countTotals } from "./lib/filter";
import { SHEET_URL } from "./lib/sheet";
import type { Filters, StatusFilter } from "./types";

const FILTROS_INICIAIS: Filters = {
  search: "",
  status: "todos",
  confidences: [],
  origens: [],
};

export const App = () => {
  const { rows, loading, error, fetchedAt, reload } = useSheetData();
  const [filters, setFilters] = useState<Filters>(FILTROS_INICIAIS);

  const visiveis = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const totals = useMemo(() => countTotals(rows), [rows]);
  const origens = useMemo(() => contarOrigens(rows), [rows]);

  const setStatus = (status: StatusFilter) => setFilters((prev) => ({ ...prev, status }));

  return (
    <main className="app">
      <header className="cabecalho">
        <h1>De-para de exercícios</h1>
        <p>
          Planilha Smart Fit × dataset <code>hasaneyldrm/exercises-dataset</code>, lido ao vivo do
          Google Sheets. Clique num número para filtrar.
        </p>
      </header>

      {error ? (
        <div className="erro">
          {error} — <button className="link" onClick={reload}>tentar de novo</button>
        </div>
      ) : null}

      <StatsBar
        totals={totals}
        visiveis={visiveis.length}
        status={filters.status}
        onStatus={setStatus}
      />

      <OriginFilter
        origens={origens}
        licencaDe={(origem) => licencaDe(rows, origem)}
        filters={filters}
        onChange={setFilters}
      />

      <Toolbar
        filters={filters}
        onChange={setFilters}
        fetchedAt={fetchedAt}
        loading={loading}
        onReload={reload}
        sheetUrl={SHEET_URL}
      />

      {loading && !rows.length ? (
        <p className="vazio">Lendo a planilha…</p>
      ) : (
        <ExerciseGrid rows={visiveis} />
      )}
    </main>
  );
};
