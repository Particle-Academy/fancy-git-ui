export type RepositoryEntry = {
  id: string;
  name: string;
  path: string;
  kind: "file" | "directory" | "symlink" | "submodule";
  size?: number;
  status?: string;
};

export interface RepositoryBrowserProps {
  value: RepositoryEntry[];
  path: string;
  selectedPath?: string;
  onPathChange?: (path: string) => void;
  onSelectedPathChange?: (path: string) => void;
  loading?: boolean;
  className?: string;
}

export function RepositoryBrowser({ value, path, selectedPath, onPathChange, onSelectedPathChange, loading, className }: RepositoryBrowserProps) {
  const crumbs = path.split("/").filter(Boolean);
  return <section className={className} data-git-repository-browser="" aria-label="Repository browser" aria-busy={loading}>
    <nav aria-label="Repository path"><button type="button" onClick={() => onPathChange?.("")}>root</button>
      {crumbs.map((crumb, index) => <span key={`${crumb}-${index}`}> / <button type="button" onClick={() => onPathChange?.(crumbs.slice(0, index + 1).join("/"))}>{crumb}</button></span>)}
    </nav>
    <ul>{value.map((entry) => <li key={entry.id} data-git-path={entry.path} data-git-entry-kind={entry.kind}>
      <button type="button" aria-pressed={selectedPath === entry.path} onClick={() => entry.kind === "directory" ? onPathChange?.(entry.path) : onSelectedPathChange?.(entry.path)}>
        <span aria-hidden>{entry.kind === "directory" ? "📁" : "📄"}</span> {entry.name}<small>{entry.status}</small>
      </button>
    </li>)}</ul>
  </section>;
}
