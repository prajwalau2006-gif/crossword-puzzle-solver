import cors from "cors";
import express from "express";
import { z } from "zod";
import { generatePuzzle } from "./algorithms/generator.js";
import { solveCrossword } from "./algorithms/solver.js";
import { findPuzzle, puzzles } from "./data/puzzles.js";
import type { SolverAlgorithm } from "./types/puzzle.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const algorithmSchema = z.enum([
  "brute-force",
  "backtracking",
  "csp",
  "forward-checking",
]);
const gridSchema = z.array(z.array(z.string())).min(1);
const solveSchema = z.object({
  grid: gridSchema,
  words: z.array(z.string()).min(1),
  algorithm: algorithmSchema.optional(),
});

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    project: "Crossword Puzzle Solver",
    algorithm: "Backtracking + CSP + Forward Checking",
  });
});

app.get("/api/puzzles", (_request, response) => {
  response.json(
    puzzles.map(({ solution: _solution, ...puzzle }) => puzzle),
  );
});

app.get("/api/puzzles/:id", (request, response) => {
  const puzzle = findPuzzle(request.params.id);

  if (!puzzle) {
    response.status(404).json({ error: "Puzzle not found." });
    return;
  }

  const { solution: _solution, ...publicPuzzle } = puzzle;
  response.json(publicPuzzle);
});

app.post("/api/solve", (request, response) => {
  const parsed = solveSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: "Invalid solve request.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    response.json(
      solveCrossword(
        parsed.data.grid,
        parsed.data.words,
        parsed.data.algorithm,
      ),
    );
  } catch (error) {
    console.error("Solve error:", error);
    response.status(400).json({
      error: error instanceof Error ? error.message : "Unable to solve puzzle.",
    });
  }
});

app.post("/api/compare", (request, response) => {
  const parsed = solveSchema.omit({ algorithm: true }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid comparison request." });
    return;
  }

  const algorithms: SolverAlgorithm[] = [
    "brute-force",
    "backtracking",
    "csp",
    "forward-checking",
  ];

  try {
    response.json(
      algorithms.map((algorithm) => {
        const result = solveCrossword(
          parsed.data.grid,
          parsed.data.words,
          algorithm,
        );
        return {
          algorithm,
          solved: result.solved,
          statistics: result.statistics,
        };
      }),
    );
  } catch (error) {
    console.error("Compare error:", error);
    response.status(400).json({
      error:
        error instanceof Error ? error.message : "Unable to compare algorithms.",
    });
  }
});

app.get("/api/generate", (request, response) => {
  const query = z
    .object({
      seed: z.coerce.number().int().optional(),
      difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
      size: z.coerce.number().int().optional(),
    })
    .safeParse(request.query);

  if (!query.success) {
    response.status(400).json({ error: "Invalid generator options." });
    return;
  }

  const generated = generatePuzzle(query.data.seed, query.data.difficulty, query.data.size);
  const { solution: _solution, ...publicPuzzle } = generated;
  response.json(publicPuzzle);
});

app.use(
  (
    error: unknown,
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    response.status(500).json({
      error: error instanceof Error ? error.message : "Unexpected server error.",
    });
  },
);
