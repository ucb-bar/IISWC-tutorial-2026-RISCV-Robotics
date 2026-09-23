import { Fragment } from "react";
import { fillSeat } from "../data/instructions";

/**
 * Renders one line of instruction copy: the seat placeholder is filled in, and
 * `backticked` spans become inline code. Keeping the markup in the string means
 * src/data stays plain data.
 */
export function BenchText({ text, seat }: { text: string; seat: string }) {
  const filled = fillSeat(text, seat);
  return (
    <>
      {filled.split("`").map((part, index) => (
        <Fragment key={`${index}-${part}`}>
          {index % 2 === 1 ? <code>{part}</code> : part}
        </Fragment>
      ))}
    </>
  );
}
