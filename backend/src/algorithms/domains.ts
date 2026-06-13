import type { Grid, Slot } from "../types/puzzle.js";

function matchesPrefilledLetters(grid: Grid, slot: Slot, word: string): boolean {
  return slot.cells.every(({ row, column }, index) => {
    const cell = grid[row]?.[column] ?? "";
    return cell === "" || cell === word[index];
  });
}

export function buildInitialDomains(
  grid: Grid,
  slots: Slot[],
  words: string[],
): Map<string, string[]> {
  return new Map(
    slots.map((slot) => [
      slot.id,
      words.filter(
        (word) =>
          word.length === slot.length &&
          matchesPrefilledLetters(grid, slot, word),
      ),
    ]),
  );
}

