export type DiffLine = { id: string; kind: "context" | "addition" | "deletion" | "header"; oldNumber?: number; newNumber?: number; text: string };
export type DiffFile = { id: string; path: string; previousPath?: string; binary?: boolean; lines: DiffLine[] };
export interface DiffViewerProps {
  value: DiffFile[];
  selectedHunkIds?: string[];
  onSelectedHunkIdsChange?: (ids: string[]) => void;
  mode?: "unified" | "split";
  onModeChange?: (mode: "unified" | "split") => void;
  className?: string;
}
export function DiffViewer({ value, selectedHunkIds = [], onSelectedHunkIdsChange, mode = "unified", onModeChange, className }: DiffViewerProps) {
  const toggle = (id: string) => onSelectedHunkIdsChange?.(selectedHunkIds.includes(id) ? selectedHunkIds.filter((item) => item !== id) : [...selectedHunkIds, id]);
  return <section className={className} data-git-diff="" data-git-diff-mode={mode} aria-label="Git diff">
    <header><strong>Changes</strong><button type="button" onClick={() => onModeChange?.(mode === "unified" ? "split" : "unified")}>{mode}</button></header>
    {value.map((file) => <article key={file.id} data-git-diff-file={file.path}><h3>{file.path}</h3>
      {file.binary ? <p>Binary file</p> : <pre>{file.lines.map((line) => <button type="button" key={line.id} data-git-diff-line={line.id} data-kind={line.kind} aria-pressed={selectedHunkIds.includes(line.id)} onClick={() => line.kind === "header" && toggle(line.id)}><span>{line.oldNumber ?? " "}</span><span>{line.newNumber ?? " "}</span><code>{line.text}</code></button>)}</pre>}
    </article>)}
  </section>;
}
