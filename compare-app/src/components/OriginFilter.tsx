import type { Filters, OrigemContagem } from "../types";

type Props = {
  origens: OrigemContagem[];
  licencaDe: (origem: string) => string;
  filters: Filters;
  onChange: (filters: Filters) => void;
};

export const OriginFilter = ({ origens, licencaDe, filters, onChange }: Props) => {
  if (!origens.length) return null;

  const total = origens.reduce((soma, { total: n }) => soma + n, 0);
  const todasAtivas = filters.origens.length === origens.length;

  const alternar = (origem: string) => {
    const ativa = filters.origens.includes(origem);
    const proximas = ativa
      ? filters.origens.filter((o) => o !== origem)
      : [...filters.origens, origem];
    onChange({ ...filters, origens: proximas });
  };

  const alternarTodas = () =>
    onChange({ ...filters, origens: todasAtivas ? [] : origens.map((o) => o.origem) });

  return (
    <div className="origens">
      <div className="origens-cabecalho">
        <span className="origens-titulo">Mídia de fonte externa</span>
        <button className={`chip ${todasAtivas ? "chip-ativo" : ""}`} onClick={alternarTodas}>
          {todasAtivas ? "limpar" : `todas (${total})`}
        </button>
      </div>

      <div className="grupo">
        {origens.map(({ origem, total: n }) => (
          <button
            key={origem}
            className={`chip chip-origem ${filters.origens.includes(origem) ? "chip-ativo" : ""}`}
            onClick={() => alternar(origem)}
            title={licencaDe(origem)}
          >
            <span className="chip-origem-nome">{origem}</span>
            <span className="chip-origem-total">{n}</span>
            <span className="chip-origem-licenca">{licencaDe(origem)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
