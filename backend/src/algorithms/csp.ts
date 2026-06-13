import type { Grid, Position, Slot } from "../types/puzzle.js";
import { buildInitialDomains } from "./domains.js";
import { normalizeGrid, normalizeWords } from "./grid.js";
import { detectSlots } from "./slotDetection.js";

export interface Intersection {
  firstSlotId: string;
  secondSlotId: string;
  firstIndex: number;
  secondIndex: number;
  position: Position;
}

export interface CrosswordCsp {
  grid: Grid;
  slots: Slot[];
  domains: Map<string, string[]>;
  intersections: Intersection[];
}

function findIntersections(slots: Slot[]): Intersection[] {
  const intersections: Intersection[] = [];

  for (let first = 0; first < slots.length; first += 1) {
    for (let second = first + 1; second < slots.length; second += 1) {
      const firstSlot = slots[first]!;
      const secondSlot = slots[second]!;

      firstSlot.cells.forEach((firstPosition, firstIndex) => {
        const secondIndex = secondSlot.cells.findIndex(
          (secondPosition) =>
            secondPosition.row === firstPosition.row &&
            secondPosition.column === firstPosition.column,
        );

        if (secondIndex >= 0) {
          intersections.push({
            firstSlotId: firstSlot.id,
            secondSlotId: secondSlot.id,
            firstIndex,
            secondIndex,
            position: firstPosition,
          });
        }
      });
    }
  }

  return intersections;
}

export function createCrosswordCsp(grid: Grid, words: string[]): CrosswordCsp {
  const normalizedGrid = normalizeGrid(grid);
  const normalizedWords = normalizeWords(words);
  const slots = detectSlots(normalizedGrid);

  if (slots.length === 0) {
    throw new Error("The grid does not contain any word slots.");
  }

  const domains = buildInitialDomains(normalizedGrid, slots, normalizedWords);

  return {
    grid: normalizedGrid,
    slots,
    domains,
    intersections: findIntersections(slots),
  };
}

