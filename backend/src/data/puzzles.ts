import type { Grid, PuzzleDefinition } from "../types/puzzle.js";

// ═════════════════════════════════════════════════════════════════════════════
//  5×5 TEMPLATE A – "Classic Cross"  (Easy: 3 slots, 2 intersections)
//
//   # # V # #     Only one down word + two across words.
//   H H H H H     Constraint density is LOW → good baseline for BF.
//   # # V # #
//   H H H H H
//   # # V # #
//
//  Intersections: V[1]=upper[2]  AND  V[3]=lower[2]
// ═════════════════════════════════════════════════════════════════════════════

interface SeedA {
  id: string;
  title: string;
  concept: string;
  vertical: string;
  upper: string;
  lower: string;
  extras: string[];   // distractors  (solution words placed first in words[])
}

const seedsA: SeedA[] = [
  // V[1]=T, V[3]=C  |  upper[2]=T ✓  lower[2]=C ✓
  { id:"stack-basics", title:"Stack Basics", concept:"LIFO data structure",
    vertical:"STACK", upper:"BITES", lower:"CACHE",
    extras:["PRUNE","NODES","INNER"] },

  // V[1]=R, V[3]=A  |  upper[2]=R ✓  lower[2]=A ✓
  { id:"array-index", title:"Array Index", concept:"Contiguous data storage",
    vertical:"ARRAY", upper:"ERROR", lower:"GRAPH",
    extras:["PRUNE","INNER","BOUND"] },

  // V[1]=R, V[3]=P  |  upper[2]=R ✓  lower[2]=P ✓
  { id:"graph-links", title:"Graph Links", concept:"Vertices and edges",
    vertical:"GRAPH", upper:"ARRAY", lower:"DEPTH",
    extras:["INNER","BOUND","LOGIC"] },

  // V[1]=R, V[3]=C  |  upper[2]=R ✓  lower[2]=C ✓
  { id:"trace-path", title:"Trace a Path", concept:"Following algorithm state",
    vertical:"TRACE", upper:"ERROR", lower:"CACHE",
    extras:["PRUNE","INNER","BOUND"] },
];

function makeSolutionA(s: SeedA): Grid {
  return [
    ["#","#", s.vertical[0]!,"#","#"],
    [...s.upper],
    ["#","#", s.vertical[2]!,"#","#"],
    [...s.lower],
    ["#","#", s.vertical[4]!,"#","#"],
  ];
}

function makeBlankA(sol: Grid, reveals: number): Grid {
  const g: Grid = sol.map(r => r.map(c => c === "#" ? "#" : ""));
  [[0,2],[2,2],[4,2],[1,0],[3,4]].slice(0, reveals)
    .forEach(([r,c]) => { g[r!]![c!] = sol[r!]![c!]!; });
  return g;
}

const easyPuzzles: PuzzleDefinition[] = seedsA.map(s => {
  const sol = makeSolutionA(s);
  return {
    id: s.id, title: s.title, difficulty: "Easy", concept: s.concept,
    solution: sol, grid: makeBlankA(sol, 2),
    words: [...new Set([s.vertical, s.upper, s.lower, ...s.extras])],
  };
});

// ═════════════════════════════════════════════════════════════════════════════
//  5×5 TEMPLATE B – "Double Cross"  (Medium: 4 slots, 4 intersections)
//
//   # D1 # D2 #     TWO down words cross TWO across words.
//   H1 H1 H1 H1 H1  Each crossing letter must match at 4 distinct cells.
//   # D1 # D2 #     Constraint density is HIGHER → backtracking advantage.
//   H2 H2 H2 H2 H2
//   # D1 # D2 #
//
//  Intersections:  D1[1]=H1[1]  D2[1]=H1[3]  D1[3]=H2[1]  D2[3]=H2[3]
// ═════════════════════════════════════════════════════════════════════════════

interface SeedB {
  id: string;
  title: string;
  difficulty: "Medium" | "Hard";
  concept: string;
  d1: string;   // down at col 1
  d2: string;   // down at col 3
  h1: string;   // across at row 1
  h2: string;   // across at row 3
  extras: string[];
}

// ── Medium seeds (verified intersections) ────────────────────────────────────
// Medium word banks: some distractors match ONE of the four intersection letters.
// BF tries 9^4 ≈ 6 561 raw combos; FC collapses domains after each assignment.

const seedsMedium: SeedB[] = [
  // D1=PRUNE(R,N), D2=MODEL(O,E) | H1[1]=R H1[3]=O: ARROW ✓ | H2[1]=N H2[3]=E: INNER ✓
  { id:"prune-model", title:"Prune & Model", difficulty:"Medium",
    concept:"Search pruning meets CSP variable modeling",
    d1:"PRUNE", d2:"MODEL", h1:"ARROW", h2:"INNER",
    extras:["CACHE","GRAPH","SCOPE","DEPTH","NODES"] },

  // D1=LOGIC(O,I), D2=DEPTH(E,T) | H1[1]=O H1[3]=E: NODES ✓ | H2[1]=I H2[3]=T: NINTH ✓
  { id:"logic-depth", title:"Logic & Depth", difficulty:"Medium",
    concept:"Constraint logic with depth-first search",
    d1:"LOGIC", d2:"DEPTH", h1:"NODES", h2:"NINTH",
    extras:["CACHE","GRAPH","PRUNE","ARRAY","STACK"] },

  // D1=STATE(T,T), D2=TRACE(R,C) | H1[1]=T H1[3]=R: STORM ✓ | H2[1]=T H2[3]=C: STACK ✓
  { id:"state-trace", title:"State & Trace", difficulty:"Medium",
    concept:"State-space search with execution tracing",
    d1:"STATE", d2:"TRACE", h1:"STORM", h2:"STACK",
    extras:["CACHE","PRUNE","INNER","SCOPE","BOUND"] },

  // D1=GRAPH(R,P), D2=QUEUE(U,U) | H1[1]=R H1[3]=U: GROUP ✓ | H2[1]=P H2[3]=U: SPOUT ✓
  { id:"graph-queue", title:"Graph & Queue", difficulty:"Medium",
    concept:"Graph BFS with queue management",
    d1:"GRAPH", d2:"QUEUE", h1:"GROUP", h2:"SPOUT",
    extras:["CACHE","INNER","NODES","DEPTH","ARRAY"] },
];

// ── Hard seeds (verified intersections, large distractors per slot) ───────────
// Hard: many distractors share ONE intersection letter → BF tries thousands of
//   combinations; FC after first assignment instantly prunes both perpendicular
//   domains; the comparison table shows a dramatic timing gap.

const seedsHard: SeedB[] = [
  // D1=STACK(T,C), D2=GRAPH(R,P) | H1[1]=T H1[3]=R: STORM ✓ | H2[1]=C H2[3]=P: SCOPE ✓
  // Distractors with T@pos1: STORE,STORK,STERN,START,STRAY (many H1 candidates)
  // Distractors with C@pos1 and P@pos3: few → FC pins H2 quickly
  { id:"stack-graph-hard", title:"Stack ∩ Graph", difficulty:"Hard",
    concept:"Brute Force vs Forward Checking benchmark (4-slot dense)",
    d1:"STACK", d2:"GRAPH", h1:"STORM", h2:"SCOPE",
    extras:["STORE","STORK","STERN","STRAY","START","SCRAP","STOMP","STRAP"] },

  // D1=TRACE(R,C), D2=MODEL(O,E) | H1[1]=R H1[3]=O: ARROW ✓ | H2[1]=C H2[3]=E: SCREW ✓
  { id:"trace-model-hard", title:"Trace ∩ Model", difficulty:"Hard",
    concept:"MRV degree heuristic on 4-intersection grid",
    d1:"TRACE", d2:"MODEL", h1:"ARROW", h2:"SCREW",
    extras:["ARSON","ARTSY","PRONE","PROOF","SCRAM","SCENE","SCONE","SCOPE"] },

  // D1=PRUNE(R,N), D2=INNER(N,E) | H1[1]=R H1[3]=N: TRUNK ✓ | H2[1]=N H2[3]=E: INFER ✓
  { id:"prune-inner-hard", title:"Prune ∩ Inner", difficulty:"Hard",
    concept:"Maximum forward-checking cascade on symmetric grid",
    d1:"PRUNE", d2:"INNER", h1:"TRUNK", h2:"INFER",
    extras:["BRAND","TRAIN","DRINK","WRUNG","INDEX","ONSET","INSET","ONSET"] },

  // D1=QUEUE(U,U), D2=BOUND(O,N) | H1[1]=U H1[3]=O: KUDOS ✓ | H2[1]=U H2[3]=N: BURNS ✓
  { id:"queue-bound-hard", title:"Queue ∩ Bound", difficulty:"Hard",
    concept:"BFS queue vs domain bounds — symmetric-U intersection",
    d1:"QUEUE", d2:"BOUND", h1:"KUDOS", h2:"BURNS",
    extras:["HUMOR","TUMOR","USURP","SPOUT","FUNNY","BURNS","BUNNY","SUNNY"] },
];

function makeSolutionB(s: SeedB): Grid {
  return [
    ["#", s.d1[0]!, "#", s.d2[0]!, "#"],
    [...s.h1],
    ["#", s.d1[2]!, "#", s.d2[2]!, "#"],
    [...s.h2],
    ["#", s.d1[4]!, "#", s.d2[4]!, "#"],
  ];
}

function makeBlankB(sol: Grid, reveals: number): Grid {
  const g: Grid = sol.map(r => r.map(c => c === "#" ? "#" : ""));
  // Reveal corners of the two down words and first cell of h1
  [[0,1],[0,3],[1,0],[4,1],[4,3]].slice(0, reveals)
    .forEach(([r,c]) => { g[r!]![c!] = sol[r!]![c!]!; });
  return g;
}

const mediumPuzzles: PuzzleDefinition[] = seedsMedium.map(s => {
  const sol = makeSolutionB(s);
  return {
    id: s.id, title: s.title, difficulty: "Medium", concept: s.concept,
    solution: sol, grid: makeBlankB(sol, 1),
    words: [...new Set([s.d1, s.d2, s.h1, s.h2, ...s.extras])],
  };
});

const hardPuzzles: PuzzleDefinition[] = seedsHard.map(s => {
  const sol = makeSolutionB(s);
  return {
    id: s.id, title: s.title, difficulty: "Hard", concept: s.concept,
    solution: sol, grid: makeBlankB(sol, 0),
    words: [...new Set([s.d1, s.d2, s.h1, s.h2, ...s.extras])],
  };
});

// ═════════════════════════════════════════════════════════════════════════════
//  10×10 and 15×15 PUZZLES
// ═════════════════════════════════════════════════════════════════════════════

const makeGridFromSolution = (solution: Grid): Grid =>
  solution.map(row => row.map(cell => cell === "#" ? "#" : ""));

// ── 10×10 Easy – Seed 1 (73 blocks) ─────────────────────
const algo10EasySolution: Grid = [
  ["#","#","#","#","#","C","#","#","#","#"],
  ["#","#","P","#","#","O","#","#","#","#"],
  ["#","#","O","#","#","N","#","#","#","#"],
  ["#","#","I","#","#","Q","U","E","R","Y"],
  ["#","#","N","#","#","U","#","#","#","#"],
  ["#","#","T","O","K","E","N","#","#","#"],
  ["#","#","E","#","#","R","#","#","#","#"],
  ["#","#","R","#","#","I","#","#","#","#"],
  ["#","#","#","L","I","N","K","#","#","#"],
  ["#","#","#","#","#","G","#","#","#","#"]
];

// ── 10×10 Medium – Seed 1 (63 blocks) ───────────────────
const algo10MediumSolution: Grid = [
  ["#","#","#","#","#","C","#","#","#","#"],
  ["#","#","P","#","C","O","D","E","#","#"],
  ["F","L","O","W","#","N","#","#","G","#"],
  ["#","#","I","#","#","Q","U","E","R","Y"],
  ["#","#","N","#","#","U","#","#","A","#"],
  ["#","#","T","O","K","E","N","#","P","#"],
  ["#","#","E","#","#","R","#","#","H","#"],
  ["#","#","R","#","#","I","#","#","#","#"],
  ["#","#","#","L","I","N","K","#","#","#"],
  ["#","#","#","#","#","G","#","#","#","#"]
];

// ── 10×10 Hard – Seed 11 (48 blocks) ────────────────────
const algo10HardSolution: Grid = [
  ["#","N","#","#","#","#","#","#","#","#"],
  ["#","P","#","C","O","D","E","#","#","#"],
  ["#","C","#","O","#","#","#","M","#","S"],
  ["B","O","U","N","D","#","H","E","A","P"],
  ["#","M","#","Q","#","#","#","R","#","U"],
  ["#","P","R","U","N","I","N","G","#","R"],
  ["#","L","#","E","#","#","#","E","#","I"],
  ["S","E","A","R","C","H","#","#","#","O"],
  ["#","T","#","#","#","#","#","#","#","U"],
  ["N","E","T","W","O","R","K","#","#","S"]
];

// ── 15×15 Easy – Seed 1 (182 blocks) ────────────────────
const branch15EasySolution: Grid = [
  ["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"],
  ["#","#","#","#","#","#","#","#","#","#","S","#","#","#","#"],
  ["#","#","#","#","#","#","#","A","#","#","O","#","#","#","#"],
  ["#","#","#","#","#","#","#","S","P","U","R","I","O","U","S"],
  ["#","#","#","#","#","L","#","Y","#","#","T","#","#","#","#"],
  ["#","#","#","#","#","I","#","M","#","#","#","#","#","#","#"],
  ["#","#","#","#","#","N","#","P","#","#","#","#","#","#","#"],
  ["#","#","#","#","V","E","R","T","E","X","#","#","#","#","#"],
  ["#","#","#","#","#","A","#","O","#","#","#","#","#","#","#"],
  ["#","#","#","#","#","R","#","T","H","R","E","A","D","#","#"],
  ["#","#","#","#","#","#","#","I","#","#","#","#","#","#","#"],
  ["#","#","#","S","T","R","U","C","T","U","R","E","#","#","#"],
  ["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"],
  ["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"],
  ["#","#","#","#","#","#","#","#","#","#","#","#","#","#","#"]
];

// ── 15×15 Medium – Seed 11 (144 blocks) ─────────────────
const solver15MediumSolution: Grid = [
  ["#","#","#","#","#","#","C","#","#","#","#","S","#","#","#"],
  ["#","#","#","#","#","#","U","#","#","#","#","O","#","#","#"],
  ["#","A","R","C","H","I","T","E","C","T","U","R","E","#","#"],
  ["#","#","E","#","A","#","#","#","#","#","#","T","#","#","#"],
  ["#","#","C","#","L","#","V","#","#","#","D","#","#","#","G"],
  ["#","#","U","#","T","#","E","#","P","O","I","N","T","E","R"],
  ["#","#","R","#","I","#","R","#","#","#","J","#","#","#","A"],
  ["#","#","S","#","N","E","T","W","O","R","K","#","#","#","M"],
  ["#","#","I","#","G","#","E","#","#","#","S","#","#","#","M"],
  ["#","#","V","#","#","#","X","#","#","#","T","#","#","#","A"],
  ["#","M","E","R","G","E","#","Q","U","E","R","Y","#","#","R"],
  ["#","#","W","#","#","#","#","#","#","#","A","#","#","#","#"],
  ["#","#","A","#","#","#","#","#","#","#","#","#","#","#","#"],
  ["#","A","L","G","O","R","I","T","H","M","#","#","#","#","#"],
  ["#","#","K","#","#","#","#","#","#","#","#","#","#","#","#"]
];

// ── 15×15 Hard – Seed 342 (115 blocks) ──────────────────
const branch15HardSolution: Grid = [
  ["B","#","#","#","#","#","#","#","#","#","#","G","#","V","#"],
  ["A","#","#","#","L","#","#","R","#","#","A","R","R","A","Y"],
  ["C","#","#","S","O","L","V","E","#","A","#","A","#","R","#"],
  ["K","#","#","#","G","#","#","D","#","R","#","P","#","I","#"],
  ["T","#","#","#","A","#","#","U","#","C","#","H","E","A","P"],
  ["R","#","C","#","R","#","#","C","#","H","#","#","#","B","#"],
  ["A","#","O","#","I","#","#","T","#","I","#","L","#","L","#"],
  ["C","O","N","S","T","R","A","I","N","T","M","O","D","E","L"],
  ["K","#","Q","#","H","#","#","O","#","E","#","G","#","S","#"],
  ["E","#","U","#","M","#","#","N","#","C","#","I","#","#","#"],
  ["R","#","E","#","I","#","#","#","S","T","A","C","K","#","#"],
  ["#","#","R","#","C","U","T","#","#","U","#","#","#","S","#"],
  ["#","#","I","#","#","#","R","#","#","R","#","#","#","O","#"],
  ["R","U","N","T","I","M","E","#","N","E","T","W","O","R","K"],
  ["#","#","G","#","#","#","E","#","#","#","#","#","#","T","#"]
];

// ═════════════════════════════════════════════════════════════════════════════
//  EXPORT
// ═════════════════════════════════════════════════════════════════════════════

export const puzzles: PuzzleDefinition[] = [
  // 4 × Easy 5×5  (Template A – 3 slots, 2 intersections)
  ...easyPuzzles,

  // 4 × Medium 5×5  (Template B – 4 slots, 4 intersections)
  ...mediumPuzzles,

  // 4 × Hard 5×5  (Template B – 4 slots, 4 intersections, large word banks)
  ...hardPuzzles,

  // ── Easy 10×10 ─────────────────────────────────────────────────────────────
  {
    id: "algorithm-fundamentals",
    title: "Algorithm Fundamentals (10×10)",
    difficulty: "Easy",
    concept: "Easy 10x10 crossword with 73 blocks and 10 candidate words",
    solution: algo10EasySolution,
    grid: makeGridFromSolution(algo10EasySolution),
    words: ["LOGIC","QUERY","AUTOMATON","PRUNING","QUADRATIC","CONQUERING","TOKEN","TRAVERSAL","POINTER","LINK"],
  },

  // ── Medium 10×10 ────────────────────────────────────────────────────────────
  {
    id: "recursive-search",
    title: "Recursive Search (10×10)",
    difficulty: "Medium",
    concept: "Medium 10x10 crossword with 63 blocks and 13 candidate words",
    solution: algo10MediumSolution,
    grid: makeGridFromSolution(algo10MediumSolution),
    words: ["CONQUERING","STATE","TREE","LINK","FLOW","REDUCTION","QUERY","POINTER","TOKEN","ASYMPTOTIC","CODE","DATA","GRAPH"],
  },

  // ── Hard 10×10 ──────────────────────────────────────────────────────────────
  {
    id: "constraint-analysis",
    title: "Constraint Analysis (10×10)",
    difficulty: "Hard",
    concept: "Hard 10x10 crossword with 48 blocks and 18 candidate words",
    solution: algo10HardSolution,
    grid: makeGridFromSolution(algo10HardSolution),
    words: ["BOUND","LOOP","COMPILER","POLYNOMIAL","SEARCH","CODE","VALID","NETWORK","ASYMPTOTIC","SPURIOUS","ALGORITHM","HEAP","PRUNING","MATRIX","MERGE","CONQUER","REDUCTION","NPCOMPLETE"],
  },

  // ── Easy 15×15 ─────────────────────────────────────────────────────────────
  {
    id: "recursive-branch",
    title: "Recursive Branch (15×15)",
    difficulty: "Easy",
    concept: "Easy 15x15 crossword with 182 blocks and 12 candidate words",
    solution: branch15EasySolution,
    grid: makeGridFromSolution(branch15EasySolution),
    words: ["LINEAR","SORT","THREAD","ASYMPTOTIC","CONSTANT","LOOP","SPURIOUS","VERTEX","DIVIDE","CONSTRAINTS","POLYNOMIAL","STRUCTURE"],
  },

  // ── Medium 15×15 ────────────────────────────────────────────────────────────
  {
    id: "optimization-lab",
    title: "Constraint Solver (15×15)",
    difficulty: "Medium",
    concept: "Medium 15x15 crossword with 144 blocks and 18 candidate words",
    solution: solver15MediumSolution,
    grid: makeGridFromSolution(solver15MediumSolution),
    words: ["HEURISTIC","EXPONENTIAL","CUT","GRAMMAR","RUNTIME","POINTER","SORT","HALTING","QUADRATIC","DIJKSTRA","VERTEX","QUERY","MERGE","BUCKET","NETWORK","RECURSIVEWALK","ALGORITHM","ARCHITECTURE"],
  },

  // ── Hard 15×15 ──────────────────────────────────────────────────────────────
  {
    id: "backtrack-solver",
    title: "Backtrack Solver (15×15)",
    difficulty: "Hard",
    concept: "Hard 15x15 crossword with 115 blocks and 26 candidate words",
    solution: branch15HardSolution,
    grid: makeGridFromSolution(branch15HardSolution),
    words: ["STACK","CUT","REDUCTION","RUNTIME","QUERY","ROUTING","LOOP","SOLVE","LOGIC","HALTING","GRAPH","STATE","SORT","TREE","COMPUTATION","VARIABLES","CONSTRAINTMODEL","NETWORK","THREAD","BACKTRACKER","ARCHITECTURE","HEAP","ARRAY","DIJKSTRA","LOGARITHMIC","CONQUERING"],
  },
];

export function findPuzzle(id: string): PuzzleDefinition | undefined {
  return puzzles.find(p => p.id === id);
}
