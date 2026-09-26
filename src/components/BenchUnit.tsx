import type { Unit } from "../data/instructions";
import { statusLabels } from "../data/instructions";
import { BenchStep } from "./BenchStep";
import { BenchText } from "./BenchText";

export function BenchUnit({ unit, seat }: { unit: Unit; seat: string }) {
  return (
    <section className="bench-unit" id={unit.id} aria-labelledby={`${unit.id}-title`}>
      <div className="container">
        <header className="bench-unit__head">
          <p className="eyebrow">{unit.eyebrow}</p>
          <h2 id={`${unit.id}-title`}>{unit.title}</h2>
          <p className="bench-unit__badges">
            <span className={`bench-badge bench-badge--${unit.status}`}>{statusLabels[unit.status]}</span>
          </p>
          {unit.note ? <p className="bench-unit__note"><BenchText text={unit.note} seat={seat} /></p> : null}
        </header>

        {unit.steps?.map((step) => <BenchStep step={step} seat={seat} key={step.id} />)}

        {unit.gaps ? (
          <ul className="bench-gaps">
            {unit.gaps.map((gap) => (
              <li key={gap}><BenchText text={gap} seat={seat} /></li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
