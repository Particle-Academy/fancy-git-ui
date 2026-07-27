// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseUnifiedDiff } from "@particle-academy/fancy-file-commons";
import { DiffViewer } from "../src/index.js";

/**
 * The diff viewer, on the suite's shared model.
 *
 * It had none of these before. It also had its own `DiffFile[]` shape, so a
 * consumer holding what `fancy-git` returns — a unified patch — had to write a
 * parser to render it, and a `Diff` from fancy-diff could not be passed at all.
 *
 * Asserted against real rendered DOM rather than a mock: the split mode these
 * cover was previously a data attribute and a toggle button with no markup
 * behind it, which every mock-shaped test in the world would have passed.
 */
const PATCH = `diff --git a/src/run.ts b/src/run.ts
--- a/src/run.ts
+++ b/src/run.ts
@@ -1,4 +1,4 @@
 import { run } from "./engine";
-const retries = 1;
+const retries = 3;
 export { run };
`;

const RENAME = `diff --git a/old.ts b/new.ts
--- a/old.ts
+++ b/new.ts
@@ -1 +1 @@
-a
+b
`;

// Testing Library only auto-cleans when vitest runs with `globals`, and this
// package does not. Without it every render stacks up in one document and
// `getByText` starts matching the previous test's output.
afterEach(cleanup);

const hunkIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-git-hunk]")).map((el) => el.getAttribute("data-git-hunk")!);

describe("DiffViewer", () => {
  it("renders a unified patch straight from fancy-git, with no parser in between", () => {
    // The integration that did not exist. `Diff.patch` is what the git package
    // returns; the viewer used to take a bespoke shape nothing produced.
    const { container } = render(<DiffViewer value={PATCH} />);

    expect(container.querySelector('[data-git-diff-file="src/run.ts"]')).not.toBeNull();
    expect(screen.getByText("const retries = 3;").closest("[data-git-diff-line]")?.getAttribute("data-kind"))
      .toBe("addition");
    expect(screen.getByText("const retries = 1;").closest("[data-git-diff-line]")?.getAttribute("data-kind"))
      .toBe("deletion");
  });

  it("accepts pre-parsed files, so one parse can feed two surfaces", () => {
    const { container } = render(<DiffViewer value={parseUnifiedDiff(PATCH)} />);

    expect(container.querySelector('[data-git-diff-file="src/run.ts"]')).not.toBeNull();
  });

  it("shows a rename as both paths", () => {
    // `fileLabel` handles this; a viewer holding its own `path` string could
    // only show one side, and would pick the wrong one for a deletion.
    render(<DiffViewer value={RENAME} />);

    expect(screen.getByRole("heading", { name: "old.ts → new.ts" })).not.toBeNull();
  });

  it("cycles a hunk through pending, accepted and rejected", () => {
    // The old API was `selectedHunkIds: string[]` — an id was in the list or
    // absent, so "not looked at yet" and "explicitly turned down" were one
    // state and a review could not tell whether it was finished.
    const onChange = vi.fn();
    const { container, rerender } = render(<DiffViewer value={PATCH} onAcceptanceChange={onChange} />);

    const [id] = hunkIds(container).filter((hunkId) =>
      container.querySelector(`[data-git-hunk="${hunkId}"] [data-git-hunk-toggle]`),
    );

    fireEvent.click(container.querySelector(`[data-git-hunk-toggle="${id}"]`)!);
    expect(onChange).toHaveBeenLastCalledWith({ [id]: "accepted" });

    rerender(<DiffViewer value={PATCH} acceptance={{ [id]: "accepted" }} onAcceptanceChange={onChange} />);
    fireEvent.click(container.querySelector(`[data-git-hunk-toggle="${id}"]`)!);
    expect(onChange).toHaveBeenLastCalledWith({ [id]: "rejected" });

    rerender(<DiffViewer value={PATCH} acceptance={{ [id]: "rejected" }} onAcceptanceChange={onChange} />);
    fireEvent.click(container.querySelector(`[data-git-hunk-toggle="${id}"]`)!);
    expect(onChange).toHaveBeenLastCalledWith({ [id]: "pending" });
  });

  it("keeps the other hunks' decisions when one changes", () => {
    // A reducer that replaced the map instead of spreading it would lose every
    // earlier decision, and the surface would look like it simply reset.
    const onChange = vi.fn();
    const { container } = render(
      <DiffViewer value={PATCH} acceptance={{ "other-hunk": "accepted" }} onAcceptanceChange={onChange} />,
    );

    fireEvent.click(container.querySelector("[data-git-hunk-toggle]")!);

    expect(onChange.mock.calls[0][0]["other-hunk"]).toBe("accepted");
  });

  it("offers no control on a context hunk", () => {
    // An `equal` hunk is context, not a proposal. A control implies there is
    // something to accept.
    const { container } = render(<DiffViewer value={PATCH} onAcceptanceChange={vi.fn()} />);

    for (const hunk of container.querySelectorAll('[data-hunk-type="equal"]')) {
      expect(hunk.querySelector("[data-git-hunk-toggle]")).toBeNull();
    }
  });

  it("offers no control at all when the caller is not listening", () => {
    // A button that cannot report anywhere is a button that silently does
    // nothing when clicked.
    const { container } = render(<DiffViewer value={PATCH} />);

    expect(container.querySelector("[data-git-hunk-toggle]")).toBeNull();
  });

  it("actually renders two columns in split mode", () => {
    // `split` used to be a data attribute and a toggle button with identical
    // markup behind it: the control moved a label and changed no output.
    const { container } = render(<DiffViewer value={PATCH} mode="split" />);

    expect(container.querySelector('[data-git-diff-side="before"]')).not.toBeNull();
    expect(container.querySelector('[data-git-diff-side="after"]')).not.toBeNull();

    // Scoped to the `replace` hunk. Every hunk gets its own pair of columns, so
    // an unscoped query lands on the leading context hunk and would pass
    // whatever the split rendering did with the change itself.
    const replaced = container.querySelector('[data-hunk-type="replace"]')!;

    expect(replaced.querySelector('[data-git-diff-side="before"]')!.textContent).toContain("const retries = 1;");
    expect(replaced.querySelector('[data-git-diff-side="before"]')!.textContent).not.toContain("const retries = 3;");
    expect(replaced.querySelector('[data-git-diff-side="after"]')!.textContent).toContain("const retries = 3;");
  });

  it("pads the shorter side so the columns stay in step", () => {
    // Without a pad, a hunk that removes three lines and adds one leaves the
    // two columns misaligned, and a removal stops lining up with its
    // replacement.
    const uneven = `--- a/x\n+++ b/x\n@@ -1,3 +1,1 @@\n-a\n-b\n-c\n+d\n`;
    const { container } = render(<DiffViewer value={uneven} mode="split" />);

    const after = container.querySelector('[data-git-diff-side="after"]')!;
    const before = container.querySelector('[data-git-diff-side="before"]')!;

    expect(after.children.length).toBe(before.children.length);
    expect(after.querySelectorAll("[data-git-diff-pad]").length).toBeGreaterThan(0);
  });

  it("says a patch shows only changed regions", () => {
    // A unified diff carries the changed hunks and a little context, never the
    // whole file — so a reader must not take a line's absence as evidence.
    render(<DiffViewer value={PATCH} />);

    expect(screen.getByText("Showing changed regions only")).not.toBeNull();
  });

  it("says so when there is nothing to show", () => {
    // An empty frame reads as a broken viewer.
    render(<DiffViewer value="" />);

    expect(screen.getByText("No changes")).not.toBeNull();
  });

  it("can hide the context git wrapped around each change", () => {
    const { container } = render(<DiffViewer value={PATCH} hideContext />);

    expect(container.querySelectorAll('[data-hunk-type="equal"]')).toHaveLength(0);
    expect(container.querySelectorAll("[data-git-hunk]").length).toBeGreaterThan(0);
  });

  it("gives every hunk a stable id, so a decision survives a re-render", () => {
    // Content-derived ids from fancy-file-commons. Index-based ones would
    // reassign every decision the moment a hunk was added above.
    const first = render(<DiffViewer value={PATCH} />);
    const ids = hunkIds(first.container);
    first.unmount();

    const second = render(<DiffViewer value={PATCH} />);
    expect(hunkIds(second.container)).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
