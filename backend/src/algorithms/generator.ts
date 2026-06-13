import type { Grid, PuzzleDefinition } from "../types/puzzle.js";
import { puzzles } from "../data/puzzles.js";

const WORD_DATABASE = [
  "ALGORITHM", "BACKTRACK", "COMPLEXITY", "STRUCTURE", "RECURSION", "REDUCTION", "OPTIMIZATION",
  "DYNAMICS", "SIMPLEX", "HEURISTIC", "TRAVERSAL", "SATISFIABILITY", "NPCOMPLETE", "VARIABLES",
  "DOMAINS", "CONSTRAINTS", "PRUNING", "SEARCH", "BRANCH", "BOUND", "QUEUE", "STACK", "GRAPH",
  "TREE", "HEAP", "HASH", "LINK", "EDGE", "PATH", "CODE", "DATA", "FILE", "SORT", "GRID", "LOOP",
  "MERGE", "QUERY", "VERTEX", "MATRIX", "BINARY", "LINEAR", "MEMORY", "BUFFER", "THREAD",
  "POINTER", "NETWORK", "ROUTING", "RUNTIME", "DATABASE", "COMPILER", "FUNCTION", "CONSTANT",
  "LOGIC", "STATE", "TRACE", "SOLVE", "TOKEN", "VALID", "ERROR", "INDEX", "CACHE", "ARRAY",
  "GREEDY", "DIVIDE", "CONQUER", "FLOW", "CUT", "MATCHING", "SPURIOUS", "COLLISION", "BUCKET",
  "RECURSE", "DIVIDING", "CONQUERING", "ANALYSIS", "ASYMPTOTIC", "NPCOMPLETENESS", "AUTOMATON",
  "GRAMMAR", "COMPUTATION", "DECIDABILITY", "TURING", "HALTING", "POLYNOMIAL", "EXPONENTIAL",
  "LOGARITHMIC", "QUADRATIC", "DIJKSTRA", "PROGRAMMING", "BACKTRACKER", "RECURSIVEWALK",
  "ARCHITECTURE", "BACKTRACKSOLVE", "CONSTRAINTMODEL", "RECURSIVEBRANCH", "BACKTRACKSOLVER",
  "OPTIMIZATIONLAB"
];

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = result[i]!;
    result[i] = result[j]!;
    result[j] = temp;
  }
  return result;
}

function getTargetWordCount(size: number, difficulty: PuzzleDefinition["difficulty"]): number {
  if (size === 5) {
    return difficulty === "Easy" ? 3 : difficulty === "Medium" ? 4 : 5;
  }
  if (size === 10) {
    return difficulty === "Easy" ? 5 : difficulty === "Medium" ? 8 : 11;
  }
  // size 15 or others
  return difficulty === "Easy" ? 7 : difficulty === "Medium" ? 13 : 18;
}

function canPlaceWord(
  grid: Grid,
  size: number,
  word: string,
  r: number,
  c: number,
  direction: "horizontal" | "vertical"
): boolean {
  const len = word.length;

  if (direction === "horizontal") {
    if (c < 0 || c + len > size || r < 0 || r >= size) return false;
    // Cell before word must be empty or out of bounds
    if (c - 1 >= 0 && grid[r]![c - 1] !== "") return false;
    // Cell after word must be empty or out of bounds
    if (c + len < size && grid[r]![c + len] !== "") return false;

    for (let k = 0; k < len; k++) {
      const cell = grid[r]![c + k]!;
      const letter = word[k]!;
      if (cell !== "") {
        if (cell !== letter) return false;
      } else {
        // If cell is empty, the vertical adjacent cells must also be empty
        if (r - 1 >= 0 && grid[r - 1]![c + k] !== "") return false;
        if (r + 1 < size && grid[r + 1]![c + k] !== "") return false;
      }
    }
    return true;
  } else {
    if (r < 0 || r + len > size || c < 0 || c >= size) return false;
    // Cell before word must be empty or out of bounds
    if (r - 1 >= 0 && grid[r - 1]![c] !== "") return false;
    // Cell after word must be empty or out of bounds
    if (r + len < size && grid[r + len]![c] !== "") return false;

    for (let k = 0; k < len; k++) {
      const cell = grid[r + k]![c]!;
      const letter = word[k]!;
      if (cell !== "") {
        if (cell !== letter) return false;
      } else {
        // If cell is empty, the horizontal adjacent cells must also be empty
        if (c - 1 >= 0 && grid[r + k]![c - 1] !== "") return false;
        if (c + 1 < size && grid[r + k]![c + 1] !== "") return false;
      }
    }
    return true;
  }
}

export function generatePuzzle(
  seed = Date.now(),
  difficulty: PuzzleDefinition["difficulty"] = "Medium",
  size = 5,
): PuzzleDefinition {
  const random = seededRandom(seed);
  const candidates = WORD_DATABASE.map(w => w.toUpperCase().replace(/[^A-Z]/g, ""))
    .filter(w => w.length >= 3 && w.length <= size);

  // Try up to 15 layout creation attempts
  for (let attempt = 0; attempt < 15; attempt++) {
    const shuffledWords = shuffle(candidates, random);
    const grid: Grid = Array.from({ length: size }, () => Array(size).fill(""));
    const placedWords: { word: string; r: number; c: number; direction: "horizontal" | "vertical" }[] = [];

    // Find the first word that fits centered horizontally
    const firstWord = shuffledWords.find(w => w.length <= size);
    if (!firstWord) continue;

    const startRow = Math.floor(size / 2);
    const startCol = Math.floor((size - firstWord.length) / 2);
    for (let k = 0; k < firstWord.length; k++) {
      grid[startRow]![startCol + k] = firstWord[k]!;
    }
    placedWords.push({ word: firstWord, r: startRow, c: startCol, direction: "horizontal" });

    const targetWordCount = getTargetWordCount(size, difficulty);
    let failStreak = 0;

    while (placedWords.length < targetWordCount && failStreak < 300) {
      // Collect letters on the grid
      const letterCells: { r: number; c: number; char: string }[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (grid[r]![c] !== "") {
            letterCells.push({ r, c, char: grid[r]![c]! });
          }
        }
      }

      if (letterCells.length === 0) break;
      const cell = letterCells[Math.floor(random() * letterCells.length)]!;

      // Determine starting layout properties
      const dirs: ("horizontal" | "vertical")[] = shuffle(["horizontal", "vertical"], random);
      let placed = false;

      for (const dir of dirs) {
        const wordCandidates = shuffledWords.filter(w => !placedWords.some(pw => pw.word === w));

        for (const W of wordCandidates) {
          const indices: number[] = [];
          for (let i = 0; i < W.length; i++) {
            if (W[i] === cell.char) indices.push(i);
          }

          const shuffledIndices = shuffle(indices, random);
          for (const i of shuffledIndices) {
            const start_r = dir === "vertical" ? cell.r - i : cell.r;
            const start_c = dir === "horizontal" ? cell.c - i : cell.c;

            if (canPlaceWord(grid, size, W, start_r, start_c, dir)) {
              for (let k = 0; k < W.length; k++) {
                const pr = dir === "vertical" ? start_r + k : start_r;
                const pc = dir === "horizontal" ? start_c + k : start_c;
                grid[pr]![pc] = W[k]!;
              }
              placedWords.push({ word: W, r: start_r, c: start_c, direction: dir });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (placed) {
        failStreak = 0;
      } else {
        failStreak++;
      }
    }

    const minWords = size === 5 ? 3 : size === 10 ? 4 : 5;
    if (placedWords.length >= minWords) {
      const solution: Grid = grid.map(row => row.map(cell => cell === "" ? "#" : cell));
      const placedWordsOnly = placedWords.map(pw => pw.word);
      const remainingCandidates = candidates.filter(w => !placedWordsOnly.includes(w));
      const distractorCount = difficulty === "Hard" ? 8 : 5;
      const selectedDistractors = shuffle(remainingCandidates, random).slice(0, distractorCount);
      const wordsList = shuffle([...placedWordsOnly, ...selectedDistractors], random);

      const openCells: [number, number][] = [];
      solution.forEach((row, r) => row.forEach((cell, c) => {
        if (cell !== "#") openCells.push([r, c]);
      }));

      const revealCount = difficulty === "Easy" ? 3 : difficulty === "Medium" ? 1 : 0;
      const shuffledOpen = shuffle(openCells, random);
      const revealedSet = new Set(shuffledOpen.slice(0, revealCount).map(([r, c]) => `${r}:${c}`));

      const startGrid: Grid = solution.map((row, r) => row.map((cell, c) => {
        if (cell === "#") return "#";
        if (revealedSet.has(`${r}:${c}`)) return cell;
        return "";
      }));

      const concept = `Generated ${difficulty} crossword grid of size ${size}x${size}`;
      return {
        id: `generated-${seed}`,
        title: `Dynamic ${difficulty} (${size}x${size})`,
        difficulty,
        concept,
        grid: startGrid,
        solution,
        words: wordsList,
      };
    }
  }

  // Fallback to static puzzles if dynamic generation fails (extremely rare)
  let candidatesStatic = puzzles.filter(
    (puzzle) => puzzle.difficulty === difficulty && puzzle.grid.length === size,
  );
  if (candidatesStatic.length === 0) {
    candidatesStatic = puzzles.filter((puzzle) => puzzle.grid.length === size);
  }
  if (candidatesStatic.length === 0) {
    candidatesStatic = [puzzles[0]!];
  }
  const source = candidatesStatic[0]!;

  const solution = source.solution.map((row) => [...row]);
  const openCells: Array<[number, number]> = [];
  solution.forEach((row, r) => row.forEach((cell, c) => {
    if (cell !== "#") openCells.push([r, c]);
  }));
  const revealCount = difficulty === "Easy" ? 3 : difficulty === "Medium" ? 1 : 0;
  const shuffled = [...openCells].sort(() => random() - 0.5);
  const revealed = new Set(
    shuffled.slice(0, revealCount).map(([r, c]) => `${r}:${c}`),
  );
  const startGrid: Grid = solution.map((row, r) =>
    row.map((cell, c) =>
      cell === "#" || revealed.has(`${r}:${c}`) ? cell : "",
    ),
  );
  const words = [...source.words].sort(() => random() - 0.5);
  return {
    ...source,
    id: `generated-${seed}`,
    title: `Generated: ${source.title}`,
    grid: startGrid,
    words,
  };
}
