import re
from typing import List

def is_open_cell(grid: List[List[str]], row: int, col: int) -> bool:
    if row < 0 or row >= len(grid):
        return False
    if col < 0 or col >= len(grid[row]):
        return False
    cell = grid[row][col]
    return cell != "#"

def normalize_grid(grid: List[List[str]]) -> List[List[str]]:
    normalized = []
    for r_idx, row in enumerate(grid):
        new_row = []
        for c_idx, cell in enumerate(row):
            if not isinstance(cell, str):
                raise ValueError(f"Invalid cell at row {r_idx + 1}, column {c_idx + 1}.")
            val = cell.strip().upper()
            if val == "#":
                new_row.append("#")
            elif val == "":
                new_row.append("")
            elif re.match(r"^[A-Z]$", val):
                new_row.append(val)
            else:
                raise ValueError(f"Invalid cell value '{cell}' at row {r_idx + 1}, column {c_idx + 1}.")
        normalized.append(new_row)
    return normalized

def normalize_words(words: List[str]) -> List[str]:
    normalized = []
    for word in words:
        w = re.sub(r"[^A-Z]", "", word.strip().upper())
        if w:
            normalized.append(w)
    return normalized
