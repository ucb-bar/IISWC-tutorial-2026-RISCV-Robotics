import { instructions } from "../data/instructions";
import { tutorial } from "../data/tutorial";
import { BenchSeat, useSeat } from "./BenchSeat";
import { BenchUnit } from "./BenchUnit";

export default function InstructionsPage() {
  const [seat, setSeat] = useSeat();

  return (
    <>
      <a className="skip-link" href="#bench-main">Skip to the steps</a>

      <header className="site-header bench-header">
        <div className="container nav-shell">
          <a className="site-brand" href="./index.html">
            <span className="site-brand__logos" aria-hidden="true">
              {tutorial.organizationLogos.map((logo) => (
                <img
                  className={`site-brand__logo site-brand__logo--${logo.kind}`}
                  src={`${import.meta.env.BASE_URL}${logo.asset}`}
                  alt=""
                  key={logo.name}
                />
              ))}
            </span>
            <span className="site-brand__label">
              <strong>{tutorial.conferenceShort}</strong>
              <small>Lab Instructions</small>
            </span>
          </a>
          <nav className="bench-nav" aria-label="Units">
            {instructions.units.map((unit) => (
              <a href={`#${unit.id}`} key={unit.id}>{unit.eyebrow}</a>
            ))}
          </nav>
        </div>
      </header>

      <main id="bench-main">
        <section className="bench-hero" aria-labelledby="bench-title">
          <div className="container">
            <p className="eyebrow">{instructions.eyebrow}</p>
            <h1 id="bench-title">{instructions.title}</h1>
            <p className="bench-hero__intro">{instructions.intro}</p>
            <BenchSeat seat={seat} onSeatChange={setSeat} />
          </div>
        </section>

        {instructions.units.map((unit) => (
          <BenchUnit unit={unit} seat={seat} key={unit.id} />
        ))}
      </main>

      <footer className="site-footer bench-footer">
        <div className="container footer-grid">
          <div>
            <strong>IISWC 2026 Tutorial</strong>
            <p>{instructions.provenance}</p>
          </div>
          <div className="footer-meta">
            <p>{instructions.secretsNote}</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="./index.html">Tutorial site</a>
            <a href="#bench-main">Back to the top</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
