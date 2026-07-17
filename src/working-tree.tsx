import type { WorkingTreeStatus } from "@particle-academy/fancy-git";

export interface WorkingTreeProps {
  value: WorkingTreeStatus;
  selectedPaths?: string[];
  onSelectedPathsChange?: (paths: string[]) => void;
  onStage?: (paths: string[]) => void;
  onUnstage?: (paths: string[]) => void;
  pending?: boolean;
  className?: string;
}

export function WorkingTree({ value, selectedPaths = [], onSelectedPathsChange, onStage, onUnstage, pending, className }: WorkingTreeProps) {
  const toggle = (path: string) => onSelectedPathsChange?.(selectedPaths.includes(path) ? selectedPaths.filter((item) => item !== path) : [...selectedPaths, path]);
  return <section className={className} data-git-working-tree="" aria-label="Working tree">
    <header><strong>{value.branch ?? "Detached HEAD"}</strong><span>{value.clean ? "Clean" : `${value.files.length} changes`}</span></header>
    <ul>{value.files.map((file) => <li key={file.path} data-git-path={file.path}>
      <label><input type="checkbox" checked={selectedPaths.includes(file.path)} onChange={() => toggle(file.path)} /> <code>{file.path}</code></label>
      <span>{file.index ?? file.worktree}</span>
    </li>)}</ul>
    <footer>
      <button type="button" disabled={pending || selectedPaths.length === 0} onClick={() => onStage?.(selectedPaths)}>Stage</button>
      <button type="button" disabled={pending || selectedPaths.length === 0} onClick={() => onUnstage?.(selectedPaths)}>Unstage</button>
    </footer>
  </section>;
}
