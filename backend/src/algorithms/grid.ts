import type { Grid } from "../types/puzzle.js";

const BLOCKED_CELL = "#";
const EMPTY_CELL = "";

export function normalizeGrid(grid: Grid): Grid {
  if (grid.length === 0) {
    throw new Error("The crossword grid must contain at least one row.");
  }

  const columnCount = grid[0]?.length ?? 0;

  if (columnCount === 0) {
    throw new Error("The crossword grid must contain at least one column.");
  }

  return grid.map((row, rowIndex) => {
    if (row.length !== columnCount) {
      throw new Error(`Grid row ${rowIndex + 1} has an inconsistent length.`);
    }

    return row.map((cell, columnIndex) => {
      const normalizedCell = cell.trim().toUpperCase();

      if (
        normalizedCell !== BLOCKED_CELL &&
        normalizedCell !== EMPTY_CELL &&
        !/^[A-Z]$/.test(normalizedCell)
      ) {
        throw new Error(
          `Invalid cell at row ${rowIndex + 1}, column ${columnIndex + 1}.`,
        );
      }

      return normalizedCell;
    });
  });
}

export function normalizeWords(words: string[]): string[] {
  const normalizedWords = words
    .map((word) => word.trim().toUpperCase())
    .filter(Boolean);

  if (normalizedWords.some((word) => !/^[A-Z]+$/.test(word))) {
    throw new Error("Candidate words may contain letters only.");
  }

  return [...new Set(normalizedWords)];
}

export function isOpenCell(grid: Grid, row: number, column: number): boolean {
  return grid[row]?.[column] !== undefined && grid[row]?.[column] !== BLOCKED_CELL;
}

