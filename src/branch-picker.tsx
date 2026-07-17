import type { Branch } from "@particle-academy/fancy-git";
export interface BranchPickerProps {
  value: Branch[];
  selectedName?: string;
  onSelectedNameChange?: (name: string) => void;
  onCheckout?: (name: string) => void;
  pending?: boolean;
  className?: string;
}
export function BranchPicker({ value, selectedName, onSelectedNameChange, onCheckout, pending, className }: BranchPickerProps) {
  return <div className={className} data-git-branch-picker="">
    <label>Branch <select value={selectedName ?? ""} onChange={(event) => onSelectedNameChange?.(event.target.value)}>
      <option value="" disabled>Select a branch</option>{value.map((branch) => <option key={branch.name} value={branch.name}>{branch.current ? "✓ " : ""}{branch.name}</option>)}
    </select></label>
    <button type="button" disabled={!selectedName || pending} onClick={() => selectedName && onCheckout?.(selectedName)}>Propose checkout</button>
  </div>;
}
