# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Pre-1.0:** breaking changes land in MINOR releases. Until 1.0 the minor
> number is not a compatibility promise — read the entry, not the version.

## [Unreleased]

## [0.4.0] — 2026-08-07

### Changed

- **BREAKING — Node 22 is now declared as the floor.** `engines.node` is `>=22`, where this package previously declared **nothing at all**.

  Declaring nothing was not the same as supporting old Node: a consumer on 18 installed cleanly and found out at runtime.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.


### Changed

- Widened the `fancy-git` and `fancy-file-commons` requirement from `^0.1.0 / ^0.2.0` to `>=0.1 <2.0 / >=0.2 <2.0`, so a
  sibling minor release is an upgrade and not a resolver conflict. **No action
  needed** — widening a range only adds candidates; the version you have today
  still resolves.

  A caret on a `0.x` range locks the MINOR, so this pinned a sibling at
  whatever it happened to be on the day it was written, and each sibling
  release then read as a conflict to the resolver rather than an upgrade.
  Nothing here was using an API the newer minors removed — the range was the
  whole problem.

## [0.3.1] — 2026-07-27

### Fixed

- **`WorkingTree`'s Stage and Unstage sat at opposite edges of the footer.** The
  footer shared the header's `space-between`, which is right for a title and a
  badge and wrong for a group of actions — the moment there were two buttons
  they were flung apart. Caught by looking at it, not by the 34 tests, which
  assert what the buttons do and cannot see where they sit.

## [0.3.0] — 2026-07-27

### Changed

- **BREAKING (peer dep): every surface is now built from `react-fancy`.** They
  were raw HTML — `<input type="checkbox">`, `<select>`, `<textarea>`, bare
  `<button>` — in a kit whose whole premise is that its surfaces match the app
  they are dropped into. A git panel rendering the browser's own native controls
  was the one place that visibly wasn't true, and no amount of host CSS fixes a
  native `<select>`.

  **What you have to do:** `npm install @particle-academy/react-fancy` (^4.17.0).
  That is the entire migration — **no prop changed, and every `data-git-*`
  handle is exactly where it was**, so agent bridges and stylesheets targeting
  them are unaffected.

  What each surface now uses:

  | | |
  |---|---|
  | `WorkingTree` | `<Checkbox>` (the path is its label), `<Badge>` for status, `<Button>` |
  | `CommitHistory` | `<Avatar>` for the author, `<Text>`, `<Button>` |
  | `ReviewList` | `<Badge>` coloured by state, `<Text>` |
  | `RepositoryBrowser` | `<Breadcrumbs>`, `<Icon>`, `<Badge>` |
  | `BranchPicker` | `<Select>`, `<Button>` |
  | `CommitComposer` | `<Form>`, `<Input>`, `<Textarea>`, `<Button>` |
  | `CreateReviewForm` | `<Form>`, `<Input>`, `<Select>`, `<Textarea>`, `<Checkbox>` |

  **`RepositoryBrowser` is deliberately NOT `<TreeNav>`.** The shapes look
  alike and the models are not: `TreeNav` holds a whole tree in memory and
  expands in place, while this browser is lazy and one level at a time —
  `value` is a single directory and `onPathChange` asks the host for the next.
  A repository has far more files than anyone wants to load to draw one folder.

### Added

- **`mode="view"` on `CommitComposer` and `CreateReviewForm`** renders the draft
  as text instead of fields. This is the propose-then-confirm half of the
  package's trust-but-verify shape: someone reviewing an agent's draft should be
  reading it, not looking at an edit form they can change by accident. Free from
  `<Form>`, which broadcasts the mode to every input inside it.
- **`CreateReviewForm` refuses a branch merging into itself**, with the reason on
  the field. The provider rejects it too — after a round trip that spends a token
  and a rate-limit unit, and reports it in its own wording.
- **Selection is marked on the row** (`data-selected`) in `CommitHistory`,
  `ReviewList` and `RepositoryBrowser`, so a host can style the whole row rather
  than reaching for the button's `aria-pressed`.
- **34 tests**, up from one. They assert against rendered DOM — an import proves
  a module loaded, not that a primitive reached the page.

### Fixed

- **Entry icons were 📁/📄 emoji**, which ignored the host's icon set and rendered
  differently on every platform. Now `<Icon>`, and a submodule and a symlink are
  no longer both drawn as plain files.

## [0.2.1] — 2026-07-26

### Fixed

- **The diff header ran its title into its mode toggle** — it rendered as
  `Changesunified`. The same defect `[data-git-path]` had in 0.1.2: two adjacent
  inline boxes with no layout between them. The header, the per-file headings
  and the mode toggle now have one, and the diff has a border like the other
  surfaces.

  Caught in a browser. The 13 tests assert structure and behaviour, and none of
  them can see two words touching — which is the whole argument for looking at
  the thing before calling it shipped.

## [0.2.0] — 2026-07-26

### Changed

- **BREAKING: `<DiffViewer>` now uses the suite's shared diff model** —
  `@particle-academy/fancy-file-commons`, the same one fancy-diff and fancy-code
  read. It had its own `DiffLine` / `DiffFile`, so a `Diff` produced anywhere
  else in the suite could not be handed to it, and this was the poorer of the
  two models: no word-level segmentation, no stable content-derived hunk ids,
  and a `split` mode that was a data attribute with no rendering behind it.

  **What you have to do**, in the order it will bite:

  1. **Pass the patch string.** `value` now takes `fancy-git`'s `Diff.patch`
     directly — `<DiffViewer value={diff.patch} />`. If you wrote a unified-diff
     parser to feed the old `DiffFile[]`, **delete it**; that was work the
     component should never have asked for. Already-parsed `Diff[]` also works,
     for sharing one parse with another surface.
  2. **Swap `selectedHunkIds` for `acceptance`.** It is a
     `Record<hunkId, "accepted" | "rejected" | "pending">` rather than a
     `string[]`, because an id that is either present or absent cannot
     distinguish *not reviewed yet* from *turned down* — so a review could not
     tell whether it was finished. Missing entries read as `pending`.
     `onSelectedHunkIdsChange` becomes `onAcceptanceChange`.
  3. **Nothing else.** `mode` / `onModeChange` / `className` are unchanged, and
     every `data-git-*` handle an agent bridge or a stylesheet targets is
     unchanged. If you only rendered a diff and never tracked selection, step 1
     is your whole migration.

  Add the peer: `npm install @particle-academy/fancy-file-commons`.

### Added

- **`split` mode actually renders two columns.** It previously set
  `data-git-diff-mode="split"` and emitted identical markup, so the toggle
  changed a label and nothing else. Sides pair by position and the shorter one
  is padded, so a removal stays aligned with what replaced it.
- **`hideContext`** drops the `equal` hunks git wraps around each change.
- **A partial-diff notice.** A unified diff carries the changed regions and a
  little context, never the whole file, so the viewer says so — otherwise a
  reader takes a line's absence as evidence it is not in the file.
- **An empty state.** An empty frame reads as a broken viewer.
- **Renames show both paths** (`old.ts → new.ts`), and a deletion shows its real
  path rather than `/dev/null`, via `fileLabel`.
- **13 tests for `<DiffViewer>`**, against rendered DOM. It had none — which is
  how a `split` mode that rendered nothing shipped in the first place.


## [0.1.2] — 2026-07-26

### Fixed

- **`<WorkingTree>` rows ran the path and its status together** — a file showed
  as `src/runtime/run-flow.tsmodified`. The row's two children (the path label
  and the status) are adjacent inline boxes and the stylesheet never gave the
  row a layout, so they simply abutted. Every consumer saw it; it surfaced when
  the showcase first rendered the component.

  The row is now a flex line with the status pushed right and dimmed, and a long
  path ellipsises instead of pushing the status off the edge.

  **What you must DO:** nothing, if you import
  `@particle-academy/fancy-git-ui/styles.css`.
  If you replaced that stylesheet with your own, add a layout for
  `[data-git-path]` — the markup is unchanged.

[Unreleased]: https://github.com/Particle-Academy/fancy-git-ui/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/Particle-Academy/fancy-git-ui/compare/v0.1.1...v0.1.2
