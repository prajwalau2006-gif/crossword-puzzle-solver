import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator.js";
import { solveCrossword } from "./solver.js";
import { puzzles } from "../data/puzzles.js";

describe("solveCrossword", () => {
  it.each([
    "brute-force",
    "backtracking",
    "csp",
    "forward-checking",
  ] as const)("solves a permanent puzzle with %s", (algorithm) => {
    const puzzle = puzzles[0]!;
    const result = solveCrossword(puzzle.grid, puzzle.words, algorithm);

    expect(result.solved).toBe(true);
    expect(result.grid).toEqual(puzzle.solution);
    expect(result.statistics.algorithm).toBe(algorithm);
    expect(result.statistics.recursiveCalls).toBeGreaterThan(0);
  });

  it("reports an unsolvable puzzle", () => {
    const puzzle = puzzles[0]!;
    const result = solveCrossword(puzzle.grid, ["BITES", "CACHE"]);

    expect(result.solved).toBe(false);
    expect(result.steps.at(-1)?.type).toBe("NO_SOLUTION");
  });

  it.each(puzzles.map((puzzle) => [puzzle.id, puzzle] as const))(
    "solves permanent puzzle %s",
    (_id, puzzle) => {
      const result = solveCrossword(
        puzzle.grid,
        puzzle.words,
        "forward-checking",
      );

      expect(result.solved).toBe(true);
      expect(result.grid).toEqual(puzzle.solution);
    },
  );

  it("shows a smaller explored search for early constraint checking", () => {
    const puzzle = puzzles.find(({ difficulty }) => difficulty === "Hard")!;
    const bruteForce = solveCrossword(
      puzzle.grid,
      puzzle.words,
      "brute-force",
    );
    const forwardChecking = solveCrossword(
      puzzle.grid,
      puzzle.words,
      "forward-checking",
    );

    expect(forwardChecking.statistics.exploredStates).toBeLessThan(
      bruteForce.statistics.exploredStates,
    );
  });
});

describe("generatePuzzle", () => {
  it("is reproducible and produces a solvable puzzle", () => {
    const first = generatePuzzle(42, "Hard");
    const second = generatePuzzle(42, "Hard");

    expect(first).toEqual(second);
    expect(solveCrossword(first.grid, first.words).solved).toBe(true);
  });
});
