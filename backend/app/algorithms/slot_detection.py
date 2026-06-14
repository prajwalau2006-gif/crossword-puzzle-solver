from typing import List, Dict, Any
from app.algorithms.grid import is_open_cell
from app.models import Slot, Position

def collect_cells(grid: List[List[str]], start_row: int, start_col: int, direction: str) -> List[Position]:
    cells = []
    r_step = 0
    c_step = 0
    if direction == "across":
        c_step = 1
    elif direction == "down":
        r_step = 1
    elif direction == "diagonal-down-right":
        r_step = 1
        c_step = 1
    elif direction == "diagonal-down-left":
        r_step = 1
        c_step = -1
    elif direction == "diagonal-up-right":
        r_step = -1
        c_step = 1
    elif direction == "diagonal-up-left":
        r_step = -1
        c_step = -1

    r, c = start_row, start_col
    while is_open_cell(grid, r, c):
        cells.append(Position(row=r, column=c))
        r += r_step
        c += c_step
    return cells

def detect_slots(grid: List[List[str]], diagonal: bool = False) -> List[Slot]:
    slots: List[Slot] = []
    
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if not is_open_cell(grid, r, c):
                continue

            # 1. Check Across (Horizontal)
            starts_across = not is_open_cell(grid, r, c - 1) and is_open_cell(grid, r, c + 1)
            if starts_across:
                cells = collect_cells(grid, r, c, "across")
                if len(cells) >= 2:
                    slots.append(Slot(
                        id=f"A-{r}-{c}",
                        direction="across",
                        start=Position(row=r, column=c),
                        length=len(cells),
                        cells=cells
                    ))

            # 2. Check Down (Vertical)
            starts_down = not is_open_cell(grid, r - 1, c) and is_open_cell(grid, r + 1, c)
            if starts_down:
                cells = collect_cells(grid, r, c, "down")
                if len(cells) >= 2:
                    slots.append(Slot(
                        id=f"D-{r}-{c}",
                        direction="down",
                        start=Position(row=r, column=c),
                        length=len(cells),
                        cells=cells
                    ))

            if diagonal:
                # 3. Check Diagonal Down-Right (↘): starts at top-left of "\" path
                starts_ddr = not is_open_cell(grid, r - 1, c - 1) and is_open_cell(grid, r + 1, c + 1)
                if starts_ddr:
                    cells = collect_cells(grid, r, c, "diagonal-down-right")
                    if len(cells) >= 2:
                        slots.append(Slot(
                            id=f"DDR-{r}-{c}",
                            direction="diagonal-down-right",
                            start=Position(row=r, column=c),
                            length=len(cells),
                            cells=cells
                        ))

                # 4. Check Diagonal Down-Left (↙): starts at top-right of "/" path
                starts_ddl = not is_open_cell(grid, r - 1, c + 1) and is_open_cell(grid, r + 1, c - 1)
                if starts_ddl:
                    cells = collect_cells(grid, r, c, "diagonal-down-left")
                    if len(cells) >= 2:
                        slots.append(Slot(
                            id=f"DDL-{r}-{c}",
                            direction="diagonal-down-left",
                            start=Position(row=r, column=c),
                            length=len(cells),
                            cells=cells
                        ))

                # 5. Check Diagonal Up-Right (↗): starts at bottom-left of "/" path
                starts_dur = not is_open_cell(grid, r + 1, c - 1) and is_open_cell(grid, r - 1, c + 1)
                if starts_dur:
                    cells = collect_cells(grid, r, c, "diagonal-up-right")
                    if len(cells) >= 2:
                        slots.append(Slot(
                            id=f"DUR-{r}-{c}",
                            direction="diagonal-up-right",
                            start=Position(row=r, column=c),
                            length=len(cells),
                            cells=cells
                        ))

                # 6. Check Diagonal Up-Left (↖): starts at bottom-right of "\" path
                starts_dul = not is_open_cell(grid, r + 1, c + 1) and is_open_cell(grid, r - 1, c - 1)
                if starts_dul:
                    cells = collect_cells(grid, r, c, "diagonal-up-left")
                    if len(cells) >= 2:
                        slots.append(Slot(
                            id=f"DUL-{r}-{c}",
                            direction="diagonal-up-left",
                            start=Position(row=r, column=c),
                            length=len(cells),
                            cells=cells
                        ))

    return slots
