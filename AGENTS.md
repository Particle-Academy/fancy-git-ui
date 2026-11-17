# Using @particle-academy/fancy-git-ui — guide for agents

How an agent installs and uses this package in a consumer app. What the package
is, is in [README.md](./README.md). Notes for working ON this repo's code are in
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Install

```bash
npm install @particle-academy/fancy-git-ui @particle-academy/fancy-git @particle-academy/fancy-file-commons @particle-academy/react-fancy
```

```tsx
import "@particle-academy/fancy-git-ui/styles.css";
```

- **Peers:** `@particle-academy/fancy-git` (`>=0.1 <2.0`),
  `@particle-academy/fancy-file-commons` (`>=0.2 <2.0`),
  `@particle-academy/react-fancy` (`>=4.17.0`), `react ^19`, `react-dom ^19`,
  `tailwindcss ^4`.
- The backend can be the Node `@particle-academy/fancy-git` or the Composer
  `particle-academy/fancy-git`; both return the same normalized shapes.

## Find it on the Fancy MCP server

The catalog server is `https://ui.particle.academy/mcp` (streamable HTTP, no API
key; MCP id `fancy-ui`). The registry entries with `package` `fancy-git-ui`
are `branch-picker`, `commit-composer`, `commit-history`, `create-review-form`,
`diff-viewer`, `repository-browser`, `review-list` and `working-tree`.

| Need | Tool |
|---|---|
| Find a Git surface by concept | `search-components` ("diff", "commit history") |
| Exact install commands for a slug | `install-instructions` |
| The full source bundle | `get-component` |
| The backend for the data | `search-backend-packages` (stack `node` or `php`) |

Vendored source instead of the npm package: `npx fancy-cli@latest add <slug>`.

## API essentials

- Components: `WorkingTree`, `DiffViewer`, `CommitHistory`, `RepositoryBrowser`,
  `ReviewList`, `BranchPicker`, `CommitComposer`, `CreateReviewForm`, plus
  `layoutCommitGraph`. The README's Components table says what each does.
- **Controlled, intent-only.** Each takes a value and reports an intent
  (`WorkingTree`: `value`, `onStage`, `onUnstage`, `selectedPaths` /
  `onSelectedPathsChange`). Nothing calls Git; the app performs the intent.
- **`DiffViewer`** takes `value` as a unified diff string (for example
  `diff.patch` from fancy-git) or a parsed `Diff[]`. Per-hunk review is
  `acceptance` / `onAcceptanceChange`, an
  `AcceptanceState = Record<hunkId, "accepted" | "rejected" | "pending">`;
  apply it with `mergeResult` from `fancy-file-commons`. `mode` /
  `onModeChange` switch `"unified"` / `"split"`; `hideContext` drops the
  `equal` hunks.
- **Stable handles** for addressing elements: `[data-git-working-tree]`,
  `[data-git-path]`, `[data-git-diff]`, `[data-git-hunk]` (with
  `data-hunk-type`, `data-hunk-status`), `[data-git-commit-id]`,
  `[data-git-review-number]` and the rest listed in the README.
- **MCP bridge.** `registerGitBridge(host, { adapter })` in
  `@particle-academy/agent-integrations` exposes `git_status`, `git_log`,
  `git_diff`, `git_reviews_list`, `git_checks` and the proposal tools
  `git_stage`, `git_unstage`, `git_commit`, `git_checkout`, `git_fetch`,
  `git_pull`, `git_push`, `git_review_create`.

## Traps

- **A hunk with no `acceptance` entry is `pending`, not rejected.** A review is
  finished only when no hunk is pending.
- **The bridge is proposal-only by default.** A write tool called with
  `apply: true` is refused unless the bridge was registered with
  `allowApply: true` and the adapter has `applyProposal`.
- **Restyle through the `data-git-*` attributes**, not by forking a component;
  every default rule targets one.
- `equal` (context) hunks carry no accept / reject control by design.
