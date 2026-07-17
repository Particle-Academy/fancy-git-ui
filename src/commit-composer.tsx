export interface CommitDraft { message: string; description?: string }
export interface CommitComposerProps {
  value: CommitDraft;
  onChange: (value: CommitDraft) => void;
  onSubmit?: (value: CommitDraft) => void;
  pending?: boolean;
  className?: string;
}
export function CommitComposer({ value, onChange, onSubmit, pending, className }: CommitComposerProps) {
  return <form className={className} data-git-commit-composer="" onSubmit={(event) => { event.preventDefault(); onSubmit?.(value); }}>
    <label>Summary<input value={value.message} onChange={(event) => onChange({ ...value, message: event.target.value })} required /></label>
    <label>Description<textarea value={value.description ?? ""} onChange={(event) => onChange({ ...value, description: event.target.value })} /></label>
    <button type="submit" disabled={pending || !value.message.trim()}>Review commit proposal</button>
  </form>;
}
