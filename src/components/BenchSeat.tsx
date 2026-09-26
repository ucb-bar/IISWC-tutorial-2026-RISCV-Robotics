import { useEffect, useState } from "react";
import { instructions, fillSeat } from "../data/instructions";

const STORAGE_KEY = "iiswc-bench-seat";

const readStoredSeat = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

/**
 * The seat number is typed once here and every 10.42.0.N and pynq-N on the page
 * follows it, so nobody retypes an address into a command.
 */
export function useSeat(): [string, (value: string) => void] {
  const [seat, setSeat] = useState("");

  useEffect(() => {
    const stored = readStoredSeat();
    if (stored) setSeat(stored);
  }, []);

  const update = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 3);
    setSeat(digits);
    try {
      window.localStorage.setItem(STORAGE_KEY, digits);
    } catch {
      /* private browsing: the page still works, it just forgets */
    }
  };

  return [seat, update];
}

export function BenchSeat({ seat, onSeatChange }: { seat: string; onSeatChange: (value: string) => void }) {
  return (
    <div className="bench-seat">
      <div className="bench-seat__row">
        <label className="bench-seat__field" htmlFor="seat-number">
          <span>{instructions.seat.label}</span>
          <input
            id="seat-number"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="N"
            value={seat}
            onChange={(event) => onSeatChange(event.target.value)}
          />
        </label>
        <dl className="bench-seat__derived">
          {instructions.seat.derived.map((item) => (
            <div key={item.key}>
              <dt>{item.key}</dt>
              <dd>{fillSeat(item.value, seat)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="bench-seat__help">{instructions.seat.help}</p>
    </div>
  );
}
