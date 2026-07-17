import type { Commit } from "@particle-academy/fancy-git";

export interface CommitHistoryProps {
  value: Commit[];
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function CommitHistory({ value, selectedId, onSelectedIdChange, onLoadMore, hasMore, className }: CommitHistoryProps) {
  return <section className={className} data-git-commit-history="" aria-label="Commit history">
    <ol>{value.map((commit) => <li key={commit.id} data-git-commit-id={commit.id}>
      <button type="button" aria-pressed={selectedId === commit.id} onClick={() => onSelectedIdChange?.(commit.id)}>
        <code>{commit.shortId}</code><span>{commit.subject}</span><small>{commit.authorName}</small>
      </button>
    </li>)}</ol>
    {hasMore && <button type="button" onClick={onLoadMore}>Load more</button>}
  </section>;
}
