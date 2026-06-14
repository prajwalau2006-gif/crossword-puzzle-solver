import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data.puzzles import find_puzzle
from app.algorithms.solver import solve_crossword

puzzle = find_puzzle("stack-basics")
# Let's solve it first to get the solved grid
solved_res = solve_crossword(puzzle.grid, puzzle.words, "backtracking-fc-mrv")
solved_grid = solved_res["grid"]

print("Testing solved grid...")
for algo in ["brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"]:
    try:
        res = solve_crossword(solved_grid, puzzle.words, algo)
        print(f"{algo}: solved={res['solved']}, steps={len(res['steps'])}")
    except Exception as e:
        print(f"{algo} FAILED with exception: {e}")
