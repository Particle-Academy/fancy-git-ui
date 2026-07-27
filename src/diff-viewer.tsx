import { useMemo } from "react";
import {
  fileLabel,
  parseUnifiedDiff,
  type AcceptanceState,
  type AcceptanceStatus,
  type Diff,
  type DiffLine,
  type Hunk,
} from "@particle-academy/fancy-file-commons";

/**
 * A git diff, on the suite's shared diff model.
 *
 * ## Why it takes a patch string
 *
 * `fancy-git` hands back `Diff { patch, files }` — a unified diff. This used to
 * take a bespoke `DiffFile[]` instead, so every consumer had to write their own
 * unified-diff parser to get from what git returns to what the viewer renders.
 * `parseUnifiedDiff` already exists and is already the parser fancy-diff and
 * fancy-code use, so the patch goes straight in.
 *
 * ## Why the model is fancy-file-commons'
 *
 * This component used to declare its own `DiffLine` / `DiffFile`, so a `Diff`
 * produced by fancy-diff could not be handed to it and vice versa — two diff
 * models in one suite, and this was the poorer of the two: no word-level
 * segmentation, no stable content-derived hunk ids, and acceptance expressed as
 * a bare `string[]` of selected ids, which cannot say *rejected*.
 */
export interface DiffViewerProps {
  /**
   * A unified diff, or already-parsed files.
   *
   * The string form is what `fancy-git`'s `Diff.patch` carries. Pass parsed
   * `Diff[]` when the caller already has them — from `computeDiff`, or from one
   * parse shared with another surface.
   */
  value: string | Diff[];
  /**
   * Per-hunk accept / reject / pending. Controlled.
   *
   * A hunk with no entry is `pending`. That is not the same as rejected, and
   * conflating them is what the old `selectedHunkIds: string[]` did: an id was
   * either in the list or absent, so "not looked at yet" and "explicitly turned
   * down" were one state, and a review could not tell whether it was finished.
   */
  acceptance?: AcceptanceState;
  onAcceptanceChange?: (next: AcceptanceState) => void;
  /** `split` renders before and after side by side. */
  mode?: "unified" | "split";
  onModeChange?: (mode: "unified" | "split") => void;
  /** Hide `equal` hunks — the context lines git includes around each change. */
  hideContext?: boolean;
  className?: string;
}

/** Cycles pending → accepted → rejected → pending, so one control reaches all three. */
function nextStatus(current: AcceptanceStatus): AcceptanceStatus {
  return current === "pending" ? "accepted" : current === "accepted" ? "rejected" : "pending";
}

export function DiffViewer({
  value,
  acceptance = {},
  onAcceptanceChange,
  mode = "unified",
  onModeChange,
  hideContext = false,
  className,
}: DiffViewerProps) {
  // Parsing is the expensive part, and a patch does not change between renders.
  const files = useMemo(() => (typeof value === "string" ? parseUnifiedDiff(value) : value), [value]);

  const toggle = (hunkId: string) =>
    onAcceptanceChange?.({ ...acceptance, [hunkId]: nextStatus(acceptance[hunkId] ?? "pending") });

  return (
    <section className={className} data-git-diff="" data-git-diff-mode={mode} aria-label="Git diff">
      <header>
        <strong>Changes</strong>
        <button
          type="button"
          data-git-diff-mode-toggle=""
          onClick={() => onModeChange?.(mode === "unified" ? "split" : "unified")}
        >
          {mode}
        </button>
      </header>

      {files.length === 0 && <p data-git-diff-empty="">No changes</p>}

      {files.map((file, index) => (
        <FileDiff
          // `fileLabel` is undefined for a diff with no header — a computed
          // diff rather than a parsed patch — so the index carries it.
          key={fileLabel(file.file) ?? index}
          file={file}
          acceptance={acceptance}
          onToggle={onAcceptanceChange ? toggle : undefined}
          mode={mode}
          hideContext={hideContext}
        />
      ))}
    </section>
  );
}

function FileDiff({
  file,
  acceptance,
  onToggle,
  mode,
  hideContext,
}: {
  file: Diff;
  acceptance: AcceptanceState;
  onToggle?: (hunkId: string) => void;
  mode: "unified" | "split";
  hideContext: boolean;
}) {
  const path = fileLabel(file.file) ?? "(no path)";
  const hunks = hideContext ? file.hunks.filter((hunk) => hunk.type !== "equal") : file.hunks;

  return (
    <article data-git-diff-file={path}>
      <h3>{path}</h3>
      {file.file?.partial && (
        // A unified diff carries only the changed hunks plus a little context,
        // never the whole file. Saying so stops a reader taking a line's
        // absence as evidence it is not in the file.
        <p data-git-diff-partial="">Showing changed regions only</p>
      )}
      {hunks.map((hunk) => (
        <HunkView
          key={hunk.id}
          hunk={hunk}
          status={acceptance[hunk.id] ?? "pending"}
          onToggle={onToggle}
          mode={mode}
        />
      ))}
    </article>
  );
}

function HunkView({
  hunk,
  status,
  onToggle,
  mode,
}: {
  hunk: Hunk;
  status: AcceptanceStatus;
  onToggle?: (hunkId: string) => void;
  mode: "unified" | "split";
}) {
  // Equal hunks are context, not proposals — there is nothing to accept, and a
  // control implies there is.
  const reviewable = hunk.type !== "equal" && onToggle !== undefined;

  return (
    <div data-git-hunk={hunk.id} data-hunk-type={hunk.type} data-hunk-status={status}>
      {reviewable && (
        <button
          type="button"
          data-git-hunk-toggle={hunk.id}
          aria-pressed={status === "accepted"}
          aria-label={`${status} — ${hunk.type} hunk`}
          onClick={() => onToggle(hunk.id)}
        >
          {status}
        </button>
      )}
      {mode === "split" ? <SplitLines hunk={hunk} /> : <UnifiedLines hunk={hunk} />}
    </div>
  );
}

function UnifiedLines({ hunk }: { hunk: Hunk }) {
  return (
    <pre data-git-diff-lines="unified">
      {hunk.lines.map((line, index) => (
        <Line key={index} line={line} />
      ))}
    </pre>
  );
}

/**
 * Before and after, side by side.
 *
 * The old component had a `split` mode that was a data attribute and a toggle
 * button with nothing behind it — the markup was identical either way, so the
 * control changed a label and no output.
 *
 * Rows pair by position within each side rather than by line number: a
 * `replace` hunk's removals and additions correspond in order, and the line
 * numbers diverge exactly where the file changed, which is every row here.
 */
function SplitLines({ hunk }: { hunk: Hunk }) {
  const before = hunk.lines.filter((line) => line.side !== "after");
  const after = hunk.lines.filter((line) => line.side !== "before");
  const rows = Math.max(before.length, after.length);

  return (
    <div data-git-diff-lines="split">
      <pre data-git-diff-side="before">
        {Array.from({ length: rows }, (_, index) =>
          before[index] ? (
            <Line key={index} line={before[index]} side="before" />
          ) : (
            // A pad, not an omission: without it the two columns drift out of
            // alignment and a removal stops lining up with what replaced it.
            <span key={index} data-git-diff-pad="" />
          ),
        )}
      </pre>
      <pre data-git-diff-side="after">
        {Array.from({ length: rows }, (_, index) =>
          after[index] ? <Line key={index} line={after[index]} side="after" /> : <span key={index} data-git-diff-pad="" />,
        )}
      </pre>
    </div>
  );
}

function Line({ line, side }: { line: DiffLine; side?: "before" | "after" }) {
  // On a split side one number is meaningful; in unified mode both are shown,
  // which is what makes it unified.
  const shown = side === "before" ? line.beforeLineNo : side === "after" ? line.afterLineNo : undefined;

  return (
    <span data-git-diff-line={line.side} data-kind={kindOf(line)}>
      {side ? (
        <span data-git-line-no="">{shown ?? " "}</span>
      ) : (
        <>
          <span data-git-line-no="before">{line.beforeLineNo ?? " "}</span>
          <span data-git-line-no="after">{line.afterLineNo ?? " "}</span>
        </>
      )}
      <code>{line.text}</code>
    </span>
  );
}

/** The +/-/context a reader expects, derived rather than stored a second time. */
function kindOf(line: DiffLine): "addition" | "deletion" | "context" {
  return line.side === "after" ? "addition" : line.side === "before" ? "deletion" : "context";
}
