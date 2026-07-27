// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BranchPicker,
  CommitComposer,
  CommitHistory,
  CreateReviewForm,
  RepositoryBrowser,
  ReviewList,
  WorkingTree,
} from "../src/index.js";

afterEach(cleanup);

/**
 * These surfaces are built from react-fancy, and the tests say so.
 *
 * They used to be raw HTML — `<input type="checkbox">`, `<select>`,
 * `<textarea>` — in a kit whose entire premise is that its surfaces match the
 * app they are dropped into. A git panel rendering the browser's own controls
 * was the one place that visibly wasn't true.
 *
 * Asserted against rendered DOM rather than by inspecting imports: an import
 * proves a module was loaded, not that anything reached the page. The markers
 * below (`data-react-fancy-*`, the roles the primitives produce) only exist if
 * the primitive actually rendered.
 */
const GIT_STATUS = {
  branch: "main",
  upstream: null,
  ahead: 0,
  behind: 0,
  clean: false,
  files: [{ path: "src/run.ts", index: null, worktree: "modified" }],
} as never;

describe("WorkingTree", () => {
  it("emits controlled selection and stage intents", () => {
    const select = vi.fn();
    const stage = vi.fn();

    render(
      <WorkingTree
        value={GIT_STATUS}
        selectedPaths={["src/run.ts"]}
        onSelectedPathsChange={select}
        onStage={stage}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Stage" }));
    expect(stage).toHaveBeenCalledWith(["src/run.ts"]);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(select).toHaveBeenCalledWith([]);
  });

  it("labels the checkbox with the path instead of leaving them adjacent", () => {
    // Two unrelated boxes ran together before — the `run-flow.tsmodified`
    // defect. <Checkbox label> ties them into one control.
    render(<WorkingTree value={GIT_STATUS} />);

    expect(screen.getByLabelText("src/run.ts")).toBeTruthy();
  });

  it("shows the status as a Badge, not bare text", () => {
    const { container } = render(<WorkingTree value={GIT_STATUS} />);

    expect(container.querySelector("[data-git-path] [data-react-fancy-badge]")).not.toBeNull();
  });

  it("disables both actions when nothing is selected", () => {
    // Stage-nothing is not a no-op worth offering; it reads as a broken button.
    render(<WorkingTree value={GIT_STATUS} onStage={vi.fn()} onUnstage={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Stage" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "Unstage" })).toHaveProperty("disabled", true);
  });
});

describe("CommitHistory", () => {
  const commits = [
    { id: "a1", shortId: "a1b2c3d", subject: "feat: swimlanes", authorName: "Ada Lovelace" },
    { id: "b2", shortId: "e4f5g6h", subject: "fix: merge point", authorName: "dependabot[bot]" },
  ] as never[];

  it("selects a commit by id", () => {
    const onSelect = vi.fn();
    render(<CommitHistory value={commits} onSelectedIdChange={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /swimlanes/ }));
    expect(onSelect).toHaveBeenCalledWith("a1");
  });

  it("renders an author avatar rather than a bare name", () => {
    const { container } = render(<CommitHistory value={commits} />);

    expect(container.querySelectorAll("[data-react-fancy-avatar]").length).toBe(2);
  });

  it("derives initials from names that are not first-and-last", () => {
    // Git author names are free text. "dependabot[bot]" has no surname, and
    // assuming one produces a blank or a crash.
    const { container } = render(<CommitHistory value={commits} />);
    const avatars = container.querySelectorAll("[data-react-fancy-avatar]");

    expect(avatars[0].textContent).toBe("AL");
    expect(avatars[1].textContent).toBe("D");
  });

  it("marks the selected row on the row, not only the button", () => {
    const { container } = render(<CommitHistory value={commits} selectedId="a1" />);

    expect(container.querySelector('[data-git-commit-id="a1"]')?.hasAttribute("data-selected")).toBe(true);
    expect(container.querySelector('[data-git-commit-id="b2"]')?.hasAttribute("data-selected")).toBe(false);
  });
});

describe("ReviewList", () => {
  const reviews = [
    { id: "1", number: 41, title: "Fix the merge point", state: "open", sourceBranch: "fix/x", targetBranch: "main" },
    { id: "2", number: 40, title: "Add swimlanes", state: "merged", sourceBranch: "feat/y", targetBranch: "main" },
  ] as never[];

  it("selects by review number", () => {
    const onSelect = vi.fn();
    render(<ReviewList value={reviews} onSelectedNumberChange={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Fix the merge point/ }));
    expect(onSelect).toHaveBeenCalledWith(41);
  });

  it("shows state as a Badge, coloured by state", () => {
    const { container } = render(<ReviewList value={reviews} />);
    const badges = container.querySelectorAll("[data-react-fancy-badge]");

    expect(badges.length).toBe(2);
    // open and merged must not read as the same thing.
    expect(badges[0].className).not.toBe(badges[1].className);
  });
});

describe("RepositoryBrowser", () => {
  const entries = [
    { id: "1", name: "components", path: "src/components", kind: "directory" as const },
    { id: "2", name: "run.ts", path: "src/run.ts", kind: "file" as const, status: "modified" },
  ];

  it("walks into a directory and selects a file", () => {
    const onPath = vi.fn();
    const onSelect = vi.fn();

    render(
      <RepositoryBrowser
        value={entries}
        path="src"
        onPathChange={onPath}
        onSelectedPathChange={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /components/ }));
    expect(onPath).toHaveBeenCalledWith("src/components");

    fireEvent.click(screen.getByRole("button", { name: /run\.ts/ }));
    expect(onSelect).toHaveBeenCalledWith("src/run.ts");
  });

  it("navigates by breadcrumb callback, having no URL to link to", () => {
    // The reason react-fancy gained `Breadcrumbs.Item onClick` in 4.17.0: this
    // component's location lives in props, not in the address bar.
    const onPath = vi.fn();
    const { container } = render(<RepositoryBrowser value={entries} path="src/deep" onPathChange={onPath} />);

    // Scoped to the desktop trail: <Breadcrumbs> also renders a mobile
    // dropdown, and jsdom applies no media queries, so both are present.
    const trail = container.querySelector("[data-react-fancy-breadcrumbs]")!;
    const crumb = (label: string) =>
      Array.from(trail.querySelectorAll("button")).find((b) => b.textContent === label);

    expect(trail.querySelector("[data-react-fancy-breadcrumbs-item]")).not.toBeNull();

    fireEvent.click(crumb("root")!);
    expect(onPath).toHaveBeenCalledWith("");

    fireEvent.click(crumb("src")!);
    expect(onPath).toHaveBeenCalledWith("src");
  });

  it("leaves the current directory unclickable", () => {
    const { container } = render(<RepositoryBrowser value={entries} path="src/deep" onPathChange={vi.fn()} />);

    const trail = container.querySelector("[data-react-fancy-breadcrumbs]")!;
    const clickable = Array.from(trail.querySelectorAll("button")).map((b) => b.textContent);

    expect(clickable).not.toContain("deep");
    expect(clickable).toContain("src");
  });
});

describe("BranchPicker", () => {
  const branches = [
    { name: "main", current: true },
    { name: "feature/x", current: false },
  ] as never[];

  it("reports the chosen branch and proposes a checkout", () => {
    const onSelect = vi.fn();
    const onCheckout = vi.fn();

    render(
      <BranchPicker
        value={branches}
        selectedName="feature/x"
        onSelectedNameChange={onSelect}
        onCheckout={onCheckout}
      />,
    );

    fireEvent.change(screen.getByLabelText("Branch"), { target: { value: "main" } });
    expect(onSelect).toHaveBeenCalledWith("main");

    fireEvent.click(screen.getByRole("button", { name: "Propose checkout" }));
    expect(onCheckout).toHaveBeenCalledWith("feature/x");
  });

  it("marks the current branch in its label rather than reordering the list", () => {
    // A picker that sorts the current branch to the top moves the list out from
    // under the pointer every time you switch.
    render(<BranchPicker value={branches} />);

    const options = screen.getAllByRole("option").map((o) => o.textContent);
    expect(options).toContain("main (current)");
    expect(options.indexOf("main (current)")).toBeLessThan(options.indexOf("feature/x"));
  });
});

describe("CommitComposer", () => {
  it("reports edits and submits the draft", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const draft = { message: "fix: merge point" };

    render(<CommitComposer value={draft} onChange={onChange} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/Summary/), { target: { value: "fix: x" } });
    expect(onChange).toHaveBeenCalledWith({ message: "fix: x" });

    fireEvent.click(screen.getByRole("button", { name: /Review commit proposal/ }));
    expect(onSubmit).toHaveBeenCalledWith(draft);
  });

  it("refuses to submit an empty message", () => {
    render(<CommitComposer value={{ message: "  " }} onChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Review commit proposal/ })).toHaveProperty("disabled", true);
  });

  it("renders read-only in view mode, for reviewing a proposal", () => {
    // The propose-then-confirm half of trust-but-verify: someone reviewing an
    // agent's draft should be reading it, not looking at an edit form they can
    // change by accident.
    render(<CommitComposer value={{ message: "fix: merge point" }} onChange={vi.fn()} mode="view" />);

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("fix: merge point")).toBeTruthy();
  });
});

describe("CreateReviewForm", () => {
  const input = { title: "Fix", sourceBranch: "fix/x", targetBranch: "main" } as never;

  it("submits the draft", () => {
    const onSubmit = vi.fn();
    render(<CreateReviewForm value={input} onChange={vi.fn()} onSubmit={onSubmit} branches={["main", "fix/x"]} />);

    fireEvent.click(screen.getByRole("button", { name: /Review creation proposal/ }));
    expect(onSubmit).toHaveBeenCalledWith(input);
  });

  it("refuses a branch merging into itself, before the provider does", () => {
    // The provider rejects it too — after a round trip that spends a token and
    // a rate-limit unit, and reports it in its own wording.
    const same = { title: "Fix", sourceBranch: "main", targetBranch: "main" } as never;

    render(<CreateReviewForm value={same} onChange={vi.fn()} onSubmit={vi.fn()} branches={["main"]} />);

    expect(screen.getByRole("button", { name: /Review creation proposal/ })).toHaveProperty("disabled", true);
    expect(screen.getByText(/cannot merge into itself/)).toBeTruthy();
  });

  it("offers draft as a real checkbox control", () => {
    render(<CreateReviewForm value={input} onChange={vi.fn()} branches={["main", "fix/x"]} />);

    expect(screen.getByLabelText("Draft")).toBeTruthy();
  });
});
