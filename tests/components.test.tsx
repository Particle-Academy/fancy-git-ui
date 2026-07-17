// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkingTree } from "../src/index.js";

describe("WorkingTree", () => {
  it("emits controlled selection and stage intents", () => {
    const select = vi.fn();
    const stage = vi.fn();
    render(<WorkingTree value={{branch:"main",upstream:null,ahead:0,behind:0,clean:false,files:[{path:"a.ts",index:null,worktree:"modified"}]}} selectedPaths={["a.ts"]} onSelectedPathsChange={select} onStage={stage} />);
    fireEvent.click(screen.getByRole("button", {name:"Stage"}));
    expect(stage).toHaveBeenCalledWith(["a.ts"]);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(select).toHaveBeenCalledWith([]);
  });
});
