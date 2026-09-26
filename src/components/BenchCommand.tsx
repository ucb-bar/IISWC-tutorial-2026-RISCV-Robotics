import { useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "../data/instructions";
import { fillSeat } from "../data/instructions";

type CopyState = "idle" | "copied" | "selected" | "failed";

const labels: Record<CopyState, string> = {
  idle: "Copy",
  copied: "Copied",
  selected: "Selected — press Ctrl-C",
  failed: "Select it by hand",
};

/**
 * navigator.clipboard exists only in a secure context, so the execCommand path is a
 * real fallback rather than a nicety, and when that fails too the text is selected in
 * place so Ctrl-C still works. A copy button that silently does nothing is worse than
 * no copy button at all.
 */
async function writeToClipboard(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the execCommand path */
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.top = "-1000px";
  scratch.style.opacity = "0";
  document.body.appendChild(scratch);
  scratch.select();
  scratch.setSelectionRange(0, text.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  document.body.removeChild(scratch);
  return copied;
}

function selectElement(element: HTMLElement): boolean {
  const selection = window.getSelection();
  if (!selection) return false;
  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

/**
 * The "$ " prompt is drawn by CSS rather than put in the DOM, so neither the copy
 * button nor a hand-made text selection picks it up. A line that continues the
 * previous one — the previous line ended in a backslash — gets no prompt.
 */
function commandLines(text: string) {
  const lines = text.split("\n");
  return lines.map((line, index) => ({
    line,
    starts: index === 0 || !lines[index - 1].trimEnd().endsWith("\\"),
  }));
}

export function BenchCommand({ block, seat }: { block: Block; seat: string }) {
  const bodyRef = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<CopyState>("idle");
  const text = fillSeat(block.text, seat);
  const lines = useMemo(() => commandLines(text), [text]);

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2600);
    return () => window.clearTimeout(timer);
  }, [state]);

  if (block.kind === "out") {
    return (
      <div className="bench-block bench-block--out">
        <span className="bench-block__tag">You should see</span>
        <pre className="bench-out">{text}</pre>
      </div>
    );
  }

  const onCopy = () => {
    void writeToClipboard(text).then((copied) => {
      if (copied) {
        setState("copied");
        return;
      }
      setState(bodyRef.current && selectElement(bodyRef.current) ? "selected" : "failed");
    });
  };

  return (
    <div className={`bench-block bench-block--${block.kind}`}>
      <div className="bench-block__bar">
        <span className="bench-block__tag">{block.kind === "url" ? "Open this" : "Type this"}</span>
        <button className="bench-copy" type="button" onClick={onCopy}>
          <span aria-live="polite">{labels[state]}</span>
        </button>
      </div>
      {block.kind === "url" ? (
        <pre className="bench-cmd bench-cmd--url" ref={bodyRef}>
          <a href={text} target="_blank" rel="noreferrer">{text}</a>
        </pre>
      ) : (
        <pre className="bench-cmd" ref={bodyRef}>
          {lines.map(({ line, starts }, index) => (
            <span
              className={`bench-cmd__line${starts ? " bench-cmd__line--start" : ""}`}
              key={`${index}-${line}`}
            >
              {line}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}
