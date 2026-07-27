import { Badge, Button, Checkbox } from "@particle-academy/react-fancy";
import type { WorkingTreeStatus } from "@particle-academy/fancy-git";
import { statusColor } from "./status-color.js";

export interface WorkingTreeProps {
  value: WorkingTreeStatus;
  selectedPaths?: string[];
  onSelectedPathsChange?: (paths: string[]) => void;
  onStage?: (paths: string[]) => void;
  onUnstage?: (paths: string[]) => void;
  pending?: boolean;
  className?: string;
}

/**
 * Changed paths, and the intent to stage or unstage them.
 *
 * Built from react-fancy primitives rather than raw HTML: the checkbox is
 * `<Checkbox>`, the actions are `<Button>`, the status is `<Badge>`. A bare
 * `<input type="checkbox">` meant this surface ignored the host's theme, focus
 * ring and sizing scale — a git panel that looked nothing like the app it was
 * dropped into, in a kit whose entire point is that they match.
 *
 * The `data-git-*` handles are unchanged. They are the contract agents and
 * stylesheets target, and swapping the implementation must not move them.
 */
export function WorkingTree({
  value,
  selectedPaths = [],
  onSelectedPathsChange,
  onStage,
  onUnstage,
  pending,
  className,
}: WorkingTreeProps) {
  const toggle = (path: string) =>
    onSelectedPathsChange?.(
      selectedPaths.includes(path) ? selectedPaths.filter((item) => item !== path) : [...selectedPaths, path],
    );

  const none = selectedPaths.length === 0;

  return (
    <section className={className} data-git-working-tree="" aria-label="Working tree">
      <header>
        <strong>{value.branch ?? "Detached HEAD"}</strong>
        <Badge color={value.clean ? "emerald" : "amber"} variant="soft" size="sm">
          {value.clean ? "Clean" : `${value.files.length} changes`}
        </Badge>
      </header>

      <ul>
        {value.files.map((file) => {
          const status = String(file.index ?? file.worktree ?? "");

          return (
            <li key={file.path} data-git-path={file.path}>
              {/* The path IS the label. It used to be a <label> wrapping a bare
                  input with the path beside it, which left the control and its
                  text as two unrelated boxes that ran together. */}
              <Checkbox
                checked={selectedPaths.includes(file.path)}
                onCheckedChange={() => toggle(file.path)}
                label={file.path}
                size="sm"
              />
              <Badge color={statusColor(status)} variant="soft" size="sm">
                {status}
              </Badge>
            </li>
          );
        })}
      </ul>

      <footer>
        <Button type="button" size="sm" disabled={pending || none} onClick={() => onStage?.(selectedPaths)}>
          Stage
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending || none}
          onClick={() => onUnstage?.(selectedPaths)}
        >
          Unstage
        </Button>
      </footer>
    </section>
  );
}
