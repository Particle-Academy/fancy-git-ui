import { describe, expect, it } from "vitest";
import type { Commit } from "@particle-academy/fancy-git";
import { layoutCommitGraph, type GraphEdge, type GraphRow } from "../layout.js";

/** A commit, with only the fields the layout reads. */
function c(id: string, ...parents: string[]): Commit {
  return {
    id,
    shortId: id.slice(0, 7),
    parents,
    authorName: "A",
    authorEmail: "a@example.com",
    authoredAt: "2026-01-01T00:00:00Z",
    subject: id,
  };
}

const laneOf = (l: ReturnType<typeof layoutCommitGraph>, id: string): number =>
  l.rows.find((r: GraphRow) => r.id === id)!.lane;

/**
 * The acceptance criterion is explicit that a correct DAG means the HARD cases,
 * "not just a linear history": octopus merges, criss-cross merges, orphan
 * branches, and a history deep enough to force lane reuse. Each has its own
 * test below.
 */
describe("layoutCommitGraph", () => {
  it("keeps a linear history in one lane", () => {
    const l = layoutCommitGraph([c("d", "c"), c("c", "b"), c("b", "a"), c("a")]);

    expect(l.rows.map((r: GraphRow) => r.lane)).toEqual([0, 0, 0, 0]);
    expect(l.laneCount).toBe(1);
  });

  it("gives a branch its own lane and returns to one at the merge base", () => {
    //   m
    //   |\
    //   f b
    //   |/
    //   a
    const l = layoutCommitGraph([c("m", "f", "b"), c("f", "a"), c("b", "a"), c("a")]);

    expect(laneOf(l, "m")).toBe(0);
    expect(laneOf(l, "f")).toBe(0); // first parent inherits the merge's lane
    expect(laneOf(l, "b")).toBe(1);
    expect(laneOf(l, "a")).toBe(0); // both sides collapse back
    expect(l.laneCount).toBe(2);
  });

  it("handles an OCTOPUS merge — more than two parents", () => {
    const l = layoutCommitGraph([
      c("oct", "p1", "p2", "p3", "p4"),
      c("p1", "base"),
      c("p2", "base"),
      c("p3", "base"),
      c("p4", "base"),
      c("base"),
    ]);
    const octo = l.rows[0]!;

    expect(octo.edges).toHaveLength(4);
    // One lane per parent, all distinct — an octopus that reuses a lane draws
    // two branches on top of each other.
    expect(new Set(octo.edges.map((e: GraphEdge) => e.toLane)).size).toBe(4);
    expect(octo.edges[0]!.toLane, "first parent inherits").toBe(octo.lane);
    expect(l.laneCount).toBe(4);
  });

  it("handles a CRISS-CROSS merge without fanning out", () => {
    // Two merges that each take both sides — the case where a naive layout
    // keeps allocating lanes because the same commit is awaited twice.
    //   x   y
    //   |\ /|
    //   | X |
    //   |/ \|
    //   a   b
    const l = layoutCommitGraph([c("x", "a", "b"), c("y", "b", "a"), c("a", "r"), c("b", "r"), c("r")]);

    expect(l.laneCount).toBeLessThanOrEqual(3);

    // `a` is awaited by both x and y; it renders once, in one lane.
    expect(l.rows.filter((r: GraphRow) => r.id === "a")).toHaveLength(1);
    expect(l.rows.filter((r: GraphRow) => r.id === "b")).toHaveLength(1);

    // And every edge aimed at `a` lands on the lane `a` actually occupies.
    const aLane = laneOf(l, "a");
    for (const row of l.rows) {
      for (const e of row.edges.filter((e: GraphEdge) => e.parentId === "a")) {
        expect(e.toLane, `edge from ${row.id} misses a's lane`).toBe(aLane);
      }
    }
  });

  it("handles ORPHAN branches — a root with no parents", () => {
    const l = layoutCommitGraph([c("main2", "main1"), c("main1"), c("orphan2", "orphan1"), c("orphan1")]);

    expect(l.rows.find((r: GraphRow) => r.id === "main1")!.edges).toEqual([]);
    expect(l.rows.find((r: GraphRow) => r.id === "orphan1")!.edges).toEqual([]);

    // The orphan root reuses lane 0 — main's lane was freed when it ended.
    expect(laneOf(l, "orphan2")).toBe(0);
  });

  it("marks an edge dangling when the parent is outside the window", () => {
    // Paging a log means the last rows point at commits not yet fetched. A
    // renderer must fade those out rather than draw into a commit that never
    // appears.
    const l = layoutCommitGraph([c("b", "a"), c("a", "beyond-the-window")]);
    const last = l.rows[1]!;

    expect(last.edges[0]!.dangling).toBe(true);
    expect(l.rows[0]!.edges[0]!.dangling, "a is present, so that edge is solid").toBe(false);
  });

  it("REUSES lanes rather than growing forever on a deep history", () => {
    // The failure mode that makes hand-rolled graphs unusable on real repos: a
    // hundred short-lived branches rendering a hundred near-empty columns.
    const commits: Commit[] = [];
    for (let i = 0; i < 100; i++) {
      const merge = `m${i}`;
      const side = `s${i}`;
      const base = `b${i}`;
      const next = `b${i + 1}`;

      commits.push(c(merge, base, side));
      commits.push(c(side, base));
      commits.push(c(base, next));
    }
    commits.push(c("b100"));

    const l = layoutCommitGraph(commits);

    expect(l.rows).toHaveLength(301);
    expect(l.laneCount, "100 sequential branches must not mean 100 lanes").toBeLessThanOrEqual(3);
  });

  it("reports every commit exactly once, in the order given", () => {
    const input = [c("d", "c"), c("c", "a", "b"), c("b", "a"), c("a")];
    const l = layoutCommitGraph(input);

    expect(l.rows.map((r: GraphRow) => r.id)).toEqual(input.map((x: { id: string }) => x.id));
  });

  it("never assigns a lane beyond the reported laneCount", () => {
    const l = layoutCommitGraph([
      c("oct", "p1", "p2", "p3"),
      c("p1", "base"),
      c("p2", "base"),
      c("p3", "base"),
      c("base"),
    ]);

    for (const row of l.rows) {
      expect(row.lane).toBeLessThan(l.laneCount);
      for (const e of row.edges) {
        expect(e.toLane, `edge from ${row.id} exceeds laneCount`).toBeLessThan(l.laneCount);
      }
    }
  });

  it("lists the lanes that pass a row untouched", () => {
    // Without these a branch spanning a merge appears to stop and restart.
    const l = layoutCommitGraph([c("m", "f", "b"), c("f", "a"), c("b", "a"), c("a")]);
    const f = l.rows.find((r: GraphRow) => r.id === "f")!;

    // While `f` renders, `b` is still awaited in lane 1.
    expect(f.passthrough).toContain(1);
  });

  it("survives an empty history", () => {
    expect(layoutCommitGraph([])).toEqual({ rows: [], laneCount: 0 });
  });
});

describe("passthrough excludes a commit's own branches", () => {
  it("does not report lanes the commit itself just opened", () => {
    // An octopus opens a lane per parent. Those are described by its EDGES; if
    // they were also passthrough, a renderer would draw the merge's own
    // branches as unrelated history flowing past it.
    const l = layoutCommitGraph([
      c("oct", "p1", "p2", "p3"),
      c("p1", "base"),
      c("p2", "base"),
      c("p3", "base"),
      c("base"),
    ]);
    const octo = l.rows[0]!;

    expect(octo.passthrough).toEqual([]);
    expect(octo.edges.map((e: GraphEdge) => e.toLane).sort()).toEqual([0, 1, 2]);
  });

  it("still reports a genuinely unrelated branch crossing the row", () => {
    // `side` is awaited the whole time `main2`/`main1` render, and has nothing
    // to do with them — that IS a through-line.
    const l = layoutCommitGraph([
      c("tip", "main2", "side"),
      c("main2", "main1"),
      c("main1", "root"),
      c("side", "root"),
      c("root"),
    ]);

    expect(l.rows.find((r: GraphRow) => r.id === "main2")!.passthrough).toContain(1);
    expect(l.rows.find((r: GraphRow) => r.id === "main1")!.passthrough).toContain(1);
  });
});
