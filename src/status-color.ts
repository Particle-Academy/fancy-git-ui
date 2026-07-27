import type { Color } from "@particle-academy/react-fancy";

/**
 * A git status code, as the colour a reader already expects from a diff.
 *
 * Shared rather than repeated per component so the working tree and the
 * repository browser cannot drift into showing the same status two colours —
 * which is the kind of inconsistency nobody files a bug about and everybody
 * notices.
 *
 * `untracked` is deliberately neutral, not a warning: a file git has not been
 * told about is not a problem, and colouring it amber puts a caution next to
 * every new file you write.
 */
const STATUS_COLOR: Record<string, Color> = {
  added: "emerald",
  new: "emerald",
  modified: "amber",
  deleted: "rose",
  removed: "rose",
  renamed: "sky",
  copied: "sky",
  conflicted: "rose",
  untracked: "zinc",
};

export function statusColor(status: string | null | undefined): Color {
  return STATUS_COLOR[String(status ?? "").toLowerCase()] ?? "zinc";
}

/** Review state, in the colours every forge already trains people to read. */
const REVIEW_STATE_COLOR: Record<string, Color> = {
  open: "emerald",
  merged: "violet",
  closed: "rose",
  draft: "zinc",
};

export function reviewStateColor(state: string | null | undefined): Color {
  return REVIEW_STATE_COLOR[String(state ?? "").toLowerCase()] ?? "zinc";
}
