import { Button, Select } from "@particle-academy/react-fancy";
import type { Branch } from "@particle-academy/fancy-git";

export interface BranchPickerProps {
  value: Branch[];
  selectedName?: string;
  onSelectedNameChange?: (name: string) => void;
  onCheckout?: (name: string) => void;
  pending?: boolean;
  className?: string;
}

/**
 * Branch selection, and the intent to check one out.
 *
 * `<Select>` rather than a bare `<select>`: the native control cannot be styled
 * to match anything, so this was the one part of a git panel that always looked
 * like the browser's own UI instead of the app's.
 *
 * The current branch is marked in its label rather than sorted to the top — a
 * picker that reorders itself when you switch branches moves the list out from
 * under the pointer.
 */
export function BranchPicker({
  value,
  selectedName,
  onSelectedNameChange,
  onCheckout,
  pending,
  className,
}: BranchPickerProps) {
  return (
    <div className={className} data-git-branch-picker="">
      <Select
        label="Branch"
        placeholder="Select a branch"
        value={selectedName ?? ""}
        onValueChange={(name) => onSelectedNameChange?.(name)}
        list={value.map((branch) => ({
          value: branch.name,
          label: branch.current ? `${branch.name} (current)` : branch.name,
        }))}
      />
      <Button
        type="button"
        size="sm"
        disabled={!selectedName || pending}
        onClick={() => selectedName && onCheckout?.(selectedName)}
      >
        Propose checkout
      </Button>
    </div>
  );
}
