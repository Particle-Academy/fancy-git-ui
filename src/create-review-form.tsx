import { Button, Checkbox, Form, Input, Select, Textarea } from "@particle-academy/react-fancy";
import type { FieldMode } from "@particle-academy/react-fancy";
import type { CreateReviewInput } from "@particle-academy/fancy-git";

export interface CreateReviewFormProps {
  value: CreateReviewInput;
  onChange: (value: CreateReviewInput) => void;
  onSubmit?: (value: CreateReviewInput) => void;
  branches: string[];
  pending?: boolean;
  /** `"view"` renders the draft as text — see {@link CommitComposer}. */
  mode?: FieldMode;
  className?: string;
}

/**
 * Source, target, title, body → the intent to open a review.
 *
 * The one validation the component makes itself: **a branch cannot be merged
 * into itself.** The provider would reject it too, but only after a round trip
 * that spends a token and a rate-limit unit, and reports it in its own wording.
 * Everything else is the host's to judge.
 */
export function CreateReviewForm({
  value,
  onChange,
  onSubmit,
  branches,
  pending,
  mode,
  className,
}: CreateReviewFormProps) {
  const sameBranch = Boolean(value.sourceBranch) && value.sourceBranch === value.targetBranch;

  return (
    <Form
      className={className}
      mode={mode}
      data-git-create-review=""
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
    >
      <Input
        label="Title"
        required
        value={value.title}
        onValueChange={(title) => onChange({ ...value, title })}
        placeholder="Fix the merge point"
      />
      <Select
        label="Source"
        list={branches}
        value={value.sourceBranch}
        onValueChange={(sourceBranch) => onChange({ ...value, sourceBranch })}
      />
      <Select
        label="Target"
        list={branches}
        value={value.targetBranch}
        onValueChange={(targetBranch) => onChange({ ...value, targetBranch })}
        error={sameBranch ? "Pick a different branch — a branch cannot merge into itself." : undefined}
      />
      <Textarea
        label="Body"
        rows={3}
        value={value.body ?? ""}
        onValueChange={(body) => onChange({ ...value, body })}
      />
      <Checkbox
        label="Draft"
        description="Draft reviews do not notify reviewers — the right default for work in progress."
        checked={value.draft ?? false}
        onCheckedChange={(draft) => onChange({ ...value, draft })}
      />
      <Button type="submit" size="sm" disabled={pending || !value.title.trim() || sameBranch}>
        Review creation proposal
      </Button>
    </Form>
  );
}
