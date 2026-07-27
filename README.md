# Fancy Git UI

Controlled, provider-neutral React surfaces for repository state, commit history,
and pull/merge requests. Components emit intents; they never invoke Git or a
provider API themselves. Every entity has a stable `data-git-*` handle.

```bash
npm install @particle-academy/fancy-git-ui @particle-academy/fancy-git @particle-academy/fancy-file-commons
```

```tsx
import "@particle-academy/fancy-git-ui/styles.css";
```

The styles are a thin default — layout and diff colouring, nothing opinionated.
Every rule targets a `data-git-*` attribute, so restyle by overriding those
rather than by forking a component.

## Components

| | |
|---|---|
| `<WorkingTree>` | Changed paths with staged / unstaged status; emits stage and unstage intents. |
| `<DiffViewer>` | A unified diff, unified or split, with per-hunk accept / reject. |
| `<CommitHistory>` | A log, with a selected commit. |
| `<RepositoryBrowser>` | A tree of the repository at a ref. |
| `<ReviewList>` | Pull / merge requests and their state. |
| `<BranchPicker>` | Branch selection. |
| `<CommitComposer>` | Message + staged paths → a commit intent. |
| `<CreateReviewForm>` | Source, target, title, body → an open-review intent. |

Each is **controlled**: it takes a value and reports an intent, and does nothing
on its own. That is what lets an agent drive the same surface a person is looking
at — see the Human+ UX contract in the suite's `AGENTS.md`.

## `<DiffViewer>`

Takes what `fancy-git` actually returns:

```tsx
const diff = await repository.diff({ from: "main", to: "HEAD" });

<DiffViewer value={diff.patch} />
```

`value` is a unified diff string, or `Diff[]` already parsed with
`parseUnifiedDiff` / `computeDiff` when you want one parse to feed two surfaces.
Parsing, hunk ids, word-level segmentation and the merge helpers all come from
[`fancy-file-commons`](https://ui.particle.academy/packages/fancy-file-commons),
the same core fancy-diff and fancy-code use — so a diff produced anywhere in the
suite renders here.

### Accepting hunks

```tsx
const [acceptance, setAcceptance] = useState<AcceptanceState>({});

<DiffViewer value={diff.patch} acceptance={acceptance} onAcceptanceChange={setAcceptance} />
```

`AcceptanceState` is `Record<hunkId, "accepted" | "rejected" | "pending">`. A
hunk with no entry is `pending`, which is **not** the same as rejected — without
that distinction a review cannot tell whether it is finished. The hunk's control
cycles pending → accepted → rejected.

Hunk ids are content-derived and stable, so a decision survives a re-render and a
re-parse of the same patch. `equal` hunks are context and carry no control: there
is nothing to accept, and a button implies there is.

Apply the result with `mergeResult` from `fancy-file-commons`.

### Other props

`mode` / `onModeChange` — `"unified"` (default) or `"split"`, which renders
before and after side by side, padding the shorter side so a removal stays
aligned with what replaced it.

`hideContext` — drop the `equal` hunks git wraps around each change.

## Handles

Agents and stylesheets both target these; they are a contract, not an
implementation detail.

`[data-git-working-tree]` · `[data-git-path]` · `[data-git-diff]` ·
`[data-git-diff-file]` · `[data-git-hunk]` (+ `data-hunk-type`,
`data-hunk-status`) · `[data-git-hunk-toggle]` · `[data-git-diff-line]` ·
`[data-git-diff-side]` · `[data-git-commit-id]` · `[data-git-review-number]` ·
`[data-git-repository-browser]` · `[data-git-branch-picker]` ·
`[data-git-commit-composer]` · `[data-git-create-review]`

## Backends

Pairs with `@particle-academy/fancy-git` (Node) or
`particle-academy/fancy-git-php` (Composer) — one normalized provider contract
across **GitHub, GitLab and Bitbucket**, so the same surface works against any of
them. Mutations support a proposal-first mode: an agent proposes, a person
confirms.
