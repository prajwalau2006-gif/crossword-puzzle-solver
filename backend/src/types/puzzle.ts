export type Cell = "#" | "" | string;
export type Grid = Cell[][];
export type Direction = "across" | "down";

export interface Position {
  row: number;
  column: number;
}

export interface Slot {
  id: string;
  direction: Direction;
  start: Position;
  length: number;
  cells: Position[];
}

export interface SolveRequest {
  grid: Grid;
  words: string[];
  algorithm?: SolverAlgorithm;
}

export type SolverAlgorithm =
  | "brute-force"
  | "backtracking"
  | "csp"
  | "forward-checking";

export type SolverStepType =
  | "SELECT_SLOT"
  | "TRY_WORD"
  | "REJECT_WORD"
  | "ASSIGN_WORD"
  | "FORWARD_CHECK"
  | "PRUNE_BRANCH"
  | "BACKTRACK"
  | "SOLVED"
  | "NO_SOLUTION";

export interface SolverStep {
  type: SolverStepType;
  message: string;
  depth: number;
  slotId?: string;
  word?: string;
  grid?: Grid;
  removedCandidates?: number;
}

export interface SolverStatistics {
  algorithm: SolverAlgorithm;
  executionTimeMs: number;
  recursiveCalls: number;
  attemptedAssignments: number;
  successfulAssignments: number;
  constraintRejections: number;
  forwardCheckRemovals: number;
  prunedBranches: number;
  backtracks: number;
  maximumDepth: number;
  initialSearchSpace: string;
  exploredStates: number;
}

export interface SolveResponse {
  solved: boolean;
  grid: Grid;
  steps: SolverStep[];
  statistics: SolverStatistics;
}

export interface PuzzleDefinition {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  concept: string;
  grid: Grid;
  solution: Grid;
  words: string[];
}

export interface ComparisonResult {
  algorithm: SolverAlgorithm;
  solved: boolean;
  statistics: SolverStatistics;
}
