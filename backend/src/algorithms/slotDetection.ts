import type { Direction, Grid, Position, Slot } from "../types/puzzle.js";
import { isOpenCell } from "./grid.js";

function collectCells(
  grid: Grid,
  start: Position,
  direction: Direction,
): Position[] {
  const cells: Position[] = [];
  const rowStep = direction === "down" ? 1 : 0;
  const columnStep = direction === "across" ? 1 : 0;

  let row = start.row;
  let column = start.column;

  while (isOpenCell(grid, row, column)) {
    cells.push({ row, column });
    row += rowStep;
    column += columnStep;
  }

  return cells;
}

export function detectSlots(grid: Grid): Slot[] {
  const slots: Slot[] = [];

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row]!.length; column += 1) {
      if (!isOpenCell(grid, row, column)) {
        continue;
      }

      const startsAcross =
        !isOpenCell(grid, row, column - 1) &&
        isOpenCell(grid, row, column + 1);
      const startsDown =
        !isOpenCell(grid, row - 1, column) &&
        isOpenCell(grid, row + 1, column);

      if (startsAcross) {
        const cells = collectCells(grid, { row, column }, "across");
        slots.push({
          id: `A-${row}-${column}`,
          direction: "across",
          start: { row, column },
          length: cells.length,
          cells,
        });
      }

      if (startsDown) {
        const cells = collectCells(grid, { row, column }, "down");
        slots.push({
          id: `D-${row}-${column}`,
          direction: "down",
          start: { row, column },
          length: cells.length,
          cells,
        });
      }
    }
  }

  return slots;
}

