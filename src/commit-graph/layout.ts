import type { Commit } from "@particle-academy/fancy-git";

/** Where one commit sits, and how it connects to its parents. */
export interface GraphRow {
  id: string;
  /** Zero-based column. Stable for the length of a branch's run. */
  lane: number;
  /**
   * Lanes occupied by OTHER branches passing this row untouched. A renderer
   * draws a vertical through-line in each; without them a branch that spans a
   * merge appears to stop and restart.
   */
  passthrough: number[];
  edges: GraphEdge[];
}

/** A link from a commit down to one of its parents. */
export interface GraphEdge {
  parentId: string;
  /** The child's lane. */
  fromLane: number;
  /** The lane the parent will occupy. */
  toLane: number;
  /**
   * True when the parent is not in the supplied commits — the history window
   * ends before it. A renderer should fade the edge out rather than draw it
   * into a commit that never appears.
   */
  dangling: boolean;
}

export interface GraphLayout {
  rows: GraphRow[];
  /** Widest point — how many columns a renderer must reserve. */
  laneCount: number;
}

/**
 * Assign lanes and route edges for a commit DAG.
 *
 * A pure function of `Commit[]` (each carrying `parents`), deliberately
 * separate from any rendering: lane assignment is decided by git's semantics,
 * not by a design, so it can be settled and tested before anyone agrees what
 * the panel looks like.
 *
 * ## The rule
 *
 * Commits are consumed in the order given — git log order, newest first. A
 * commit takes the lane already RESERVED for it by an earlier child, or the
 * leftmost free lane if it has none. Its **first parent inherits that lane**,
 * which is what makes a branch read as one continuous column instead of
 * wandering; every additional parent reserves its own lane, or merges into the
 * one it already holds.
 *
 * ## Why lanes are freed eagerly
 *
 * A lane is released the moment nothing is waiting in it, so a later branch can
 * reuse the column. Without that, a thousand-commit history with a hundred
 * short-lived branches renders a hundred columns wide, nearly all of them
 * empty — which is the failure mode that makes hand-rolled graphs unusable on
 * real repositories.
 */
export function layoutCommitGraph(commits: Commit[]): GraphLayout {
  /** lanes[i] = the commit id expected next in lane i, or null when free. */
  const lanes: (string | null)[] = [];
  const rows: GraphRow[] = [];
  const known = new Set(commits.map((c) => c.id));
  let laneCount = 0;

  const firstFree = (): number => {
    const i = lanes.indexOf(null);
    if (i !== -1) return i;
    lanes.push(null);
    return lanes.length - 1;
  };

  const reserve = (lane: number, id: string): void => {
    lanes[lane] = id;
  };

  for (const commit of commits) {
    // The lane an earlier child reserved for this commit, if any. A commit with
    // several children is reserved in several lanes; it renders in the
    // leftmost, and the others are released — that collapse is what stops a
    // criss-cross merge fanning out forever.
    let lane = lanes.indexOf(commit.id);
    if (lane === -1) {
      lane = firstFree();
    } else {
      for (let i = lane + 1; i < lanes.length; i++) {
        if (lanes[i] === commit.id) lanes[i] = null;
      }
    }

    lanes[lane] = null;

    const edges: GraphEdge[] = [];
    let inheritedFirstParent = false;

    for (const parentId of commit.parents) {
      const existing = lanes.indexOf(parentId);
      let toLane: number;

      if (existing !== -1) {
        // Already awaited somewhere — merge into that column rather than
        // opening another for the same commit.
        toLane = existing;
      } else if (!inheritedFirstParent) {
        // First parent continues this commit's column. This is the whole
        // reason a branch reads as one straight line.
        toLane = lane;
        inheritedFirstParent = true;
      } else {
        toLane = firstFree();
      }

      reserve(toLane, parentId);
      edges.push({ parentId, fromLane: lane, toLane, dangling: !known.has(parentId) });
    }

    // Lanes belonging to OTHER branches that cross this row untouched.
    //
    // Deliberately excludes the lanes this commit just opened for its own
    // parents: those are already described by its edges, and a renderer that
    // also drew a through-line in them would paint an octopus merge's own
    // branches as unrelated history flowing past it.
    const opened = new Set(edges.map((e) => e.toLane));
    const passthrough: number[] = [];
    for (let i = 0; i < lanes.length; i++) {
      if (i !== lane && lanes[i] !== null && !opened.has(i)) passthrough.push(i);
    }

    rows.push({ id: commit.id, lane, passthrough, edges });
    laneCount = Math.max(laneCount, lanes.length);

    // Trim trailing free lanes so laneCount reflects the real width rather
    // than the high-water mark of a branch that has since ended.
    while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop();
  }

  return { rows, laneCount };
}
