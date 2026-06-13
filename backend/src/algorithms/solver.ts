import { performance } from "node:perf_hooks";
import type {
  Grid,
  Slot,
  SolveResponse,
  SolverAlgorithm,
  SolverStatistics,
  SolverStep,
} from "../types/puzzle.js";
import { isConsistent, wordsCompatible } from "./constraints.js";
import { createCrosswordCsp, type CrosswordCsp } from "./csp.js";

const MAX_RECORDED_STEPS = 1500;

function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

function renderAssignments(
  baseGrid: Grid,
  slotsById: Map<string, Slot>,
  assignments: Map<string, string>,
): Grid {
  const result = cloneGrid(baseGrid);

  assignments.forEach((word, slotId) => {
    slotsById.get(slotId)?.cells.forEach(({ row, column }, index) => {
      result[row]![column] = word[index]!;
    });
  });

  return result;
}

function cloneDomains(domains: Map<string, string[]>): Map<string, string[]> {
  return new Map([...domains].map(([id, values]) => [id, [...values]]));
}

function searchSpace(domainSizes: number[]): string {
  if (domainSizes.some((size) => size === 0)) {
    return "0";
  }

  const logarithm = domainSizes.reduce(
    (total, size) => total + Math.log10(size),
    0,
  );

  if (logarithm > 12) {
    return `~10^${logarithm.toFixed(1)}`;
  }

  return Math.round(
    domainSizes.reduce((total, size) => total * size, 1),
  ).toLocaleString("en-US");
}

function selectSlot(
  csp: CrosswordCsp,
  assignments: Map<string, string>,
  domains: Map<string, string[]>,
  algorithm: SolverAlgorithm,
): Slot | undefined {
  const unassigned = csp.slots.filter((slot) => !assignments.has(slot.id));

  if (algorithm === "brute-force" || algorithm === "backtracking") {
    return unassigned[0];
  }

  return unassigned.sort((first, second) => {
    const domainDifference =
      (domains.get(first.id)?.length ?? 0) -
      (domains.get(second.id)?.length ?? 0);

    if (domainDifference !== 0) {
      return domainDifference;
    }

    const degree = (slot: Slot) =>
      csp.intersections.filter(
        ({ firstSlotId, secondSlotId }) =>
          firstSlotId === slot.id || secondSlotId === slot.id,
      ).length;

    return degree(second) - degree(first);
  })[0];
}

function completeAssignmentIsValid(
  csp: CrosswordCsp,
  assignments: Map<string, string>,
): boolean {
  if (new Set(assignments.values()).size !== assignments.size) {
    return false;
  }

  return csp.intersections.every((intersection) => {
    const first = assignments.get(intersection.firstSlotId);
    const second = assignments.get(intersection.secondSlotId);
    return (
      first !== undefined &&
      second !== undefined &&
      first[intersection.firstIndex] === second[intersection.secondIndex]
    );
  });
}

function forwardCheck(
  csp: CrosswordCsp,
  assignedSlot: Slot,
  assignedWord: string,
  assignments: Map<string, string>,
  domains: Map<string, string[]>,
): { domains: Map<string, string[]>; removed: number; failed: boolean } {
  const nextDomains = cloneDomains(domains);
  let removed = 0;
  let failed = false;

  for (const slot of csp.slots) {
    if (assignments.has(slot.id)) {
      continue;
    }

    const current = nextDomains.get(slot.id) ?? [];
    const filtered = current.filter(
      (candidate) =>
        candidate !== assignedWord &&
        wordsCompatible(
          assignedSlot.id,
          assignedWord,
          slot.id,
          candidate,
          csp.intersections,
        ),
    );

    removed += current.length - filtered.length;
    nextDomains.set(slot.id, filtered);
    failed ||= filtered.length === 0;
  }

  return { domains: nextDomains, removed, failed };
}

export function solveCrossword(
  grid: Grid,
  words: string[],
  algorithm: SolverAlgorithm = "forward-checking",
): SolveResponse {
  const startedAt = performance.now();
  const csp = createCrosswordCsp(grid, words);
  const assignments = new Map<string, string>();
  const slotsById = new Map(csp.slots.map((slot) => [slot.id, slot]));
  const steps: SolverStep[] = [];
  const statistics: SolverStatistics = {
    algorithm,
    executionTimeMs: 0,
    recursiveCalls: 0,
    attemptedAssignments: 0,
    successfulAssignments: 0,
    constraintRejections: 0,
    forwardCheckRemovals: 0,
    prunedBranches: 0,
    backtracks: 0,
    maximumDepth: 0,
    initialSearchSpace: searchSpace(
      csp.slots.map((slot) => csp.domains.get(slot.id)?.length ?? 0),
    ),
    exploredStates: 0,
  };

  const record = (step: SolverStep) => {
    if (steps.length < MAX_RECORDED_STEPS) {
      steps.push(step);
    }
  };

  const search = (
    depth: number,
    domains: Map<string, string[]>,
  ): boolean => {
    statistics.recursiveCalls += 1;
    statistics.exploredStates += 1;
    statistics.maximumDepth = Math.max(statistics.maximumDepth, depth);

    if (statistics.recursiveCalls > 100000 || (performance.now() - startedAt) > 4000) {
      return false;
    }

    if (assignments.size === csp.slots.length) {
      if (
        algorithm === "brute-force" &&
        !completeAssignmentIsValid(csp, assignments)
      ) {
        statistics.constraintRejections += 1;
        return false;
      }

      record({
        type: "SOLVED",
        message: "Every slot satisfies all crossword constraints.",
        depth,
        grid: renderAssignments(csp.grid, slotsById, assignments),
      });
      return true;
    }

    const slot = selectSlot(csp, assignments, domains, algorithm);
    if (!slot) {
      return false;
    }

    const candidates = domains.get(slot.id) ?? [];
    record({
      type: "SELECT_SLOT",
      message: `Selected ${slot.id} (${slot.direction}, ${slot.length} cells) with ${candidates.length} candidates.`,
      depth,
      slotId: slot.id,
    });

    for (const word of candidates) {
      statistics.attemptedAssignments += 1;
      record({
        type: "TRY_WORD",
        message: `Trying ${word} in ${slot.id}.`,
        depth,
        slotId: slot.id,
        word,
      });

      if (
        algorithm !== "brute-force" &&
        !isConsistent(slot, word, assignments, csp.intersections)
      ) {
        statistics.constraintRejections += 1;
        record({
          type: "REJECT_WORD",
          message: `${word} violates an intersection or the unique-word constraint.`,
          depth,
          slotId: slot.id,
          word,
        });
        continue;
      }

      assignments.set(slot.id, word);
      statistics.successfulAssignments += 1;
      record({
        type: "ASSIGN_WORD",
        message: `Assigned ${word} to ${slot.id}.`,
        depth,
        slotId: slot.id,
        word,
        grid: renderAssignments(csp.grid, slotsById, assignments),
      });

      let nextDomains = domains;
      let branchFailed = false;

      if (algorithm === "forward-checking") {
        const checked = forwardCheck(
          csp,
          slot,
          word,
          assignments,
          domains,
        );
        nextDomains = checked.domains;
        branchFailed = checked.failed;
        statistics.forwardCheckRemovals += checked.removed;
        record({
          type: "FORWARD_CHECK",
          message: `Forward checking removed ${checked.removed} future candidates.`,
          depth,
          slotId: slot.id,
          word,
          removedCandidates: checked.removed,
        });
      }

      if (branchFailed) {
        statistics.prunedBranches += 1;
        record({
          type: "PRUNE_BRANCH",
          message: "A future domain is empty, so this branch is pruned.",
          depth,
          slotId: slot.id,
          word,
        });
      } else if (search(depth + 1, nextDomains)) {
        return true;
      }

      assignments.delete(slot.id);
      statistics.backtracks += 1;
      record({
        type: "BACKTRACK",
        message: `Removed ${word} from ${slot.id} and restored the previous state.`,
        depth,
        slotId: slot.id,
        word,
        grid: renderAssignments(csp.grid, slotsById, assignments),
      });
    }

    return false;
  };

  const solved = search(0, cloneDomains(csp.domains));
  const resultGrid = renderAssignments(csp.grid, slotsById, assignments);

  if (!solved) {
    record({
      type: "NO_SOLUTION",
      message: "The search space was exhausted without a valid assignment.",
      depth: 0,
      grid: resultGrid,
    });
  }

  statistics.executionTimeMs = Number(
    (performance.now() - startedAt).toFixed(3),
  );

  return { solved, grid: resultGrid, steps, statistics };
}
