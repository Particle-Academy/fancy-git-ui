import { Badge, Breadcrumbs, Icon, Text } from "@particle-academy/react-fancy";
import { statusColor } from "./status-color.js";

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

/** The icon each entry kind gets. A submodule and a symlink are not just files. */
const KIND_ICON: Record<RepositoryEntry["kind"], string> = {
  directory: "folder",
  file: "file",
  symlink: "link",
  submodule: "box",
};

/**
 * One directory of a repository, at a ref.
 *
 * ## Why this is not `<TreeNav>`
 *
 * The shapes look alike; the models are not. `TreeNav` holds a whole tree in
 * memory and expands nodes in place. This browser is **lazy and one level at a
 * time** — `value` is a single directory's contents and `onPathChange` asks the
 * host to fetch the next one. A repository has far more files than anyone wants
 * to load in order to draw one folder, which is exactly why the API is shaped
 * this way.
 *
 * So the primitives here are the ones that actually fit: `<Breadcrumbs>` for
 * the path — hand-rolled `/` separators were the real duplication — `<Icon>`
 * for entry kinds, replacing 📁/📄 emoji that ignored the host's icon set and
 * rendered differently on every platform, and `<Badge>` for status.
 *
 * Reaching for `TreeNav` because the shape resembles a tree would produce a
 * component that cannot do the one thing this one exists for.
 */
export function RepositoryBrowser({
  value,
  path,
  selectedPath,
  onPathChange,
  onSelectedPathChange,
  loading,
  className,
}: RepositoryBrowserProps) {
  const crumbs = path.split("/").filter(Boolean);

  return (
    <section
      className={className}
      data-git-repository-browser=""
      aria-label="Repository browser"
      aria-busy={loading}
    >
      <Breadcrumbs>
        <Breadcrumbs.Item onClick={() => onPathChange?.("")} active={crumbs.length === 0}>
          root
        </Breadcrumbs.Item>
        {crumbs.map((crumb, index) => (
          <Breadcrumbs.Item
            key={`${crumb}-${index}`}
            // The last crumb is where you already are, so it is not a
            // destination — Breadcrumbs renders it as plain text.
            active={index === crumbs.length - 1}
            onClick={() => onPathChange?.(crumbs.slice(0, index + 1).join("/"))}
          >
            {crumb}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>

      <ul>
        {value.map((entry) => (
          <li
            key={entry.id}
            data-git-path={entry.path}
            data-git-entry-kind={entry.kind}
            data-selected={selectedPath === entry.path || undefined}
          >
            <button
              type="button"
              aria-pressed={selectedPath === entry.path}
              onClick={() =>
                entry.kind === "directory" ? onPathChange?.(entry.path) : onSelectedPathChange?.(entry.path)
              }
            >
              <Icon name={KIND_ICON[entry.kind]} size="sm" />
              <Text size="sm">{entry.name}</Text>
              {entry.status && (
                <Badge color={statusColor(entry.status)} variant="soft" size="sm">
                  {entry.status}
                </Badge>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
