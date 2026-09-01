import type { Confidence, Filters } from "../types";

const CONF: { valor: Confidence; rotulo: string }[] = [
  { valor: "A", rotulo: "A · direto" },
  { valor: "B", rotulo: "B · variação" },
  { valor: "C", rotulo: "C · proxy" },
  { valor: "-", rotulo: "— sem match" },
];

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  externas: number;
  fetchedAt: Date | null;
  loading: boolean;
  onReload: () => void;
  sheetUrl: string;
};

export const Toolbar = ({
  filters,
  onChange,
  externas,
  fetchedAt,
  loading,
  onReload,
  sheetUrl,
}: Props) => {
  const alternarConf = (valor: Confidence) => {
    const ativo = filters.confidences.includes(valor);
    const confidences = ativo
      ? filters.confidences.filter((c) => c !== valor)
      : [...filters.confidences, valor];
    onChange({ ...filters, confidences });
  };

  return (
    <div className="toolbar">
      <div className="linha">
        <input
          className="busca"
          type="search"
          placeholder="Buscar por nome em português ou inglês…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
        <button
          className={`botao ${filters.soExterna ? "chip-ativo" : ""}`}
          onClick={() => onChange({ ...filters, soExterna: !filters.soExterna })}
        >
          Só fonte externa ({externas})
        </button>
        <button className="botao" onClick={onReload} disabled={loading}>
          {loading ? "Lendo…" : "Recarregar"}
        </button>
      </div>

      <div className="linha">
        <span className="dica">confiança do de-para:</span>
        <div className="grupo">
          {CONF.map(({ valor, rotulo }) => (
            <button
              key={valor}
              className={`chip ${filters.confidences.includes(valor) ? "chip-ativo" : ""}`}
              onClick={() => alternarConf(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="linha rodape-toolbar">
        <span className="dica">
          Atualiza sozinho a cada 30s ·{" "}
          {fetchedAt ? `lido ${fetchedAt.toLocaleTimeString("pt-BR")}` : "carregando…"}
        </span>
        <a className="link" href={sheetUrl} target="_blank" rel="noreferrer">
          abrir planilha
        </a>
      </div>
    </div>
  );
};
