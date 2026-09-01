import type { Confidence, ExerciseRow } from "../types";
import { COVERAGE_ROTULO } from "../lib/filter";
import { MediaSlot } from "./MediaSlot";

const CONF_ROTULO: Record<Confidence, string> = {
  A: "A · direto",
  B: "B · variação",
  C: "C · proxy",
  "-": "sem match",
};

type Props = {
  row: ExerciseRow;
};

export const ExerciseCard = ({ row }: Props) => (
  <article className={`card card-${row.coverage}`}>
    <div className="slots">
      <MediaSlot rotulo="thumbnail" url={row.imageUrl} alt={`${row.name} — thumbnail`} />
      <MediaSlot
        rotulo="GIF"
        url={row.gifUrl || row.gifSugerido}
        alt={`${row.name} — animação`}
        sugerido={!row.gifUrl && Boolean(row.gifSugerido)}
      />
    </div>

    <div className="corpo">
      <h3 className="nome">
        <span className="linha-num">{row.linha}</span> {row.name}
      </h3>
      {row.datasetName ? (
        <p className="nome-dataset">
          {row.datasetName} <span className="id">#{row.datasetId}</span>
        </p>
      ) : (
        <p className="nome-dataset nome-dataset-vazio">nenhum exercício equivalente no dataset</p>
      )}

      <div className="tags">
        <span className={`badge badge-cob badge-cob-${row.coverage}`}>
          {COVERAGE_ROTULO[row.coverage]}
        </span>
        <span className={`badge badge-${row.confidence === "-" ? "vazio" : row.confidence}`}>
          {CONF_ROTULO[row.confidence]}
        </span>
        {!row.inVideoTab ? <span className="badge badge-aviso">ausente na aba Videos</span> : null}
        {!row.inImageTab ? <span className="badge badge-aviso">ausente na aba thumbnail</span> : null}
        {row.duplicado ? <span className="badge badge-aviso">nome duplicado</span> : null}
        {row.origem ? (
          <span className="badge badge-externa" title={row.licenca}>
            {row.origem}
          </span>
        ) : null}
        {row.licenca ? <span className="badge badge-licenca">{row.licenca}</span> : null}
      </div>
    </div>
  </article>
);
