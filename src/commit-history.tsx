import { Avatar, Button, Text } from "@particle-academy/react-fancy";
import type { Commit } from "@particle-academy/fancy-git";

/**
 * Initials for an author name, for the avatar fallback.
 *
 * Git author names are free text — "Ada Lovelace", "ada", "dependabot[bot]" —
 * so this takes the first letter of the first two words and gives up gracefully
 * rather than assuming a first/last shape that plenty of commits do not have.
 */
function initials(name: string): string {
  return (
    name
      .split(/[\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export interface CommitHistoryProps {
  value: Commit[];
  selectedId?: string;
  onSelectedIdChange?: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

/**
 * A log, with a selected commit.
 *
 * Each row stays a `<button>` rather than becoming a `<Timeline>` event: the
 * point of this surface is *selecting* a commit, and Timeline's events are
 * presentational — swapping to it would render a prettier list you cannot
 * click. So the primitives that earn their place are the ones inside the row:
 * `<Avatar>` for the author, `<Text>` for the subject, `<Button>` for the
 * pager.
 *
 * A worked example of the rule this package got wrong: reach for a primitive
 * where it carries the behaviour, not wherever the shape looks similar.
 */
export function CommitHistory({
  value,
  selectedId,
  onSelectedIdChange,
  onLoadMore,
  hasMore,
  className,
}: CommitHistoryProps) {
  return (
    <section className={className} data-git-commit-history="" aria-label="Commit history">
      <ol>
        {value.map((commit) => (
          <li key={commit.id} data-git-commit-id={commit.id} data-selected={selectedId === commit.id || undefined}>
            <button
              type="button"
              aria-pressed={selectedId === commit.id}
              onClick={() => onSelectedIdChange?.(commit.id)}
            >
              <Avatar fallback={initials(commit.authorName)} alt={commit.authorName} size="xs" />
              <span data-git-commit-body="">
                <Text size="sm" className="!font-medium">
                  {commit.subject}
                </Text>
                <Text size="xs" className="!text-zinc-500">
                  <code>{commit.shortId}</code> · {commit.authorName}
                </Text>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {hasMore && (
        <Button type="button" variant="ghost" size="sm" onClick={onLoadMore}>
          Load more
        </Button>
      )}
    </section>
  );
}
