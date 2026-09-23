import type { Step } from "../data/instructions";
import { BenchCommand } from "./BenchCommand";
import { BenchText } from "./BenchText";

export function BenchStep({ step, seat }: { step: Step; seat: string }) {
  return (
    <article className="bench-step" id={`step-${step.id}`}>
      <header>
        <span className="bench-step__number">{step.id}</span>
        <div>
          <h3><BenchText text={step.title} seat={seat} /></h3>
          <small>
            {step.where}
            {step.uplink ? <span className="bench-badge bench-badge--uplink">Needs internet</span> : null}
          </small>
        </div>
      </header>

      <div className="bench-step__body">
        {step.note ? <p className="bench-step__note"><BenchText text={step.note} seat={seat} /></p> : null}

        {step.reference ? (
          <dl className="bench-ref">
            {step.reference.map((item) => (
              <div key={item.command}>
                <dt><code>{item.command}</code></dt>
                <dd><BenchText text={item.does} seat={seat} /></dd>
              </div>
            ))}
          </dl>
        ) : null}

        {step.blocks?.map((block, index) => (
          <BenchCommand block={block} seat={seat} key={`${step.id}-${index}`} />
        ))}

        {step.takeaway ? (
          <p className="bench-step__takeaway"><BenchText text={step.takeaway} seat={seat} /></p>
        ) : null}

        {step.fixes ? (
          <details className="bench-fixes">
            <summary>If you don&rsquo;t</summary>
            <dl>
              {step.fixes.map((fix) => (
                <div key={fix.symptom}>
                  <dt><BenchText text={fix.symptom} seat={seat} /></dt>
                  <dd><BenchText text={fix.action} seat={seat} /></dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
      </div>
    </article>
  );
}
