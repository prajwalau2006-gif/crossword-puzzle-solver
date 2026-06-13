import type { Grid, Slot } from "../types/puzzle.js";
import type { Intersection } from "./csp.js";

export function wordFitsGrid(grid: Grid, slot: Slot, word: string): boolean {
  return slot.cells.every(({ row, column }, index) => {
    const current = grid[row]?.[column] ?? "";
    return current === "" || current === word[index];
  });
}

export function isConsistent(
  slot: Slot,
  word: string,
  assignments: Map<string, string>,
  intersections: Intersection[],
): boolean {
  if ([...assignments.values()].includes(word)) {
    return false;
  }

  return intersections.every((intersection) => {
    if (
      intersection.firstSlotId !== slot.id &&
      intersection.secondSlotId !== slot.id
    ) {
      return true;
    }

    const slotIsFirst = intersection.firstSlotId === slot.id;
    const otherSlotId = slotIsFirst
      ? intersection.secondSlotId
      : intersection.firstSlotId;
    const otherWord = assignments.get(otherSlotId);

    if (!otherWord) {
      return true;
    }

    const currentIndex = slotIsFirst
      ? intersection.firstIndex
      : intersection.secondIndex;
    const otherIndex = slotIsFirst
      ? intersection.secondIndex
      : intersection.firstIndex;

    return word[currentIndex] === otherWord[otherIndex];
  });
}

export function wordsCompatible(
  firstSlotId: string,
  firstWord: string,
  secondSlotId: string,
  secondWord: string,
  intersections: Intersection[],
): boolean {
  if (firstWord === secondWord) {
    return false;
  }

  return intersections.every((intersection) => {
    const forward =
      intersection.firstSlotId === firstSlotId &&
      intersection.secondSlotId === secondSlotId;
    const reverse =
      intersection.firstSlotId === secondSlotId &&
      intersection.secondSlotId === firstSlotId;

    if (!forward && !reverse) {
      return true;
    }

    return forward
      ? firstWord[intersection.firstIndex] === secondWord[intersection.secondIndex]
      : firstWord[intersection.secondIndex] === secondWord[intersection.firstIndex];
  });
}
