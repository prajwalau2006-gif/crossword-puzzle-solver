import { solveCrossword } from "./algorithms/solver.js";
import { puzzles } from "./data/puzzles.js";

try {
  const puzzle = puzzles[0]!;
  const grid = puzzle.grid.map(row => [...row]);
  grid[2]![2] = "#"; // Block row 2 col 2

  // Add words of length 2 to allow the new short slots to be filled
  const words = [
    ...puzzle.words,
    "ST", "CK", "CA", "HE", "TO", "SO", "AT", "IT"
  ];

  console.log("Running solver with modified grid and short words...");
  const result = solveCrossword(grid, words, "forward-checking");
  console.log("Solved:", result.solved);
  if (result.solved) {
    console.log("Solution Grid:");
    console.log(result.grid);
  }
} catch (error) {
  console.error("Caught error:", error);
}
