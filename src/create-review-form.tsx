import type { CreateReviewInput } from "@particle-academy/fancy-git";
export interface CreateReviewFormProps {
  value: CreateReviewInput;
  onChange: (value: CreateReviewInput) => void;
  onSubmit?: (value: CreateReviewInput) => void;
  branches: string[];
  pending?: boolean;
  className?: string;
}
export function CreateReviewForm({ value, onChange, onSubmit, branches, pending, className }: CreateReviewFormProps) {
  return <form className={className} data-git-create-review="" onSubmit={(event) => { event.preventDefault(); onSubmit?.(value); }}>
    <label>Title<input value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} required /></label>
    <label>Source<select value={value.sourceBranch} onChange={(event) => onChange({ ...value, sourceBranch: event.target.value })}>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
    <label>Target<select value={value.targetBranch} onChange={(event) => onChange({ ...value, targetBranch: event.target.value })}>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
    <label>Body<textarea value={value.body ?? ""} onChange={(event) => onChange({ ...value, body: event.target.value })} /></label>
    <label><input type="checkbox" checked={value.draft ?? false} onChange={(event) => onChange({ ...value, draft: event.target.checked })} /> Draft</label>
    <button type="submit" disabled={pending || !value.title.trim()}>Review creation proposal</button>
  </form>;
}
