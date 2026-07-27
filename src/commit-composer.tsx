import { Button, Form, Input, Textarea } from "@particle-academy/react-fancy";
import type { FieldMode } from "@particle-academy/react-fancy";

export interface CommitDraft {
  message: string;
  description?: string;
}

export interface CommitComposerProps {
  value: CommitDraft;
  onChange: (value: CommitDraft) => void;
  onSubmit?: (value: CommitDraft) => void;
  pending?: boolean;
  /**
   * `"view"` renders the draft as text instead of fields.
   *
   * This is the propose-then-confirm half of the package's trust-but-verify
   * shape: an agent fills a draft, and the human reviewing it should be reading
   * a message, not looking at an edit form they might change by accident.
   */
  mode?: FieldMode;
  className?: string;
}

/**
 * A commit message, and the intent to commit it.
 *
 * `<Form>` rather than a bare `<form>`, which is what makes `mode` work: it
 * broadcasts the field mode to every input inside, so the whole composer flips
 * to read-only in one prop rather than each field growing its own branch.
 */
export function CommitComposer({ value, onChange, onSubmit, pending, mode, className }: CommitComposerProps) {
  return (
    <Form
      className={className}
      mode={mode}
      data-git-commit-composer=""
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <Input
        label="Summary"
        required
        value={value.message}
        onValueChange={(message) => onChange({ ...value, message })}
        placeholder="Fix the merge point"
      />
      <Textarea
        label="Description"
        rows={3}
        value={value.description ?? ""}
        onValueChange={(description) => onChange({ ...value, description })}
      />
      <Button type="submit" size="sm" disabled={pending || !value.message.trim()}>
        Review commit proposal
      </Button>
    </Form>
  );
}
