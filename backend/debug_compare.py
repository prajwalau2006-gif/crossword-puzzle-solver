import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data.puzzles import find_puzzle
from app.algorithms.solver import solve_crossword

puzzle = find_puzzle("unsolvable-demo")
if puzzle:
    print("Testing unsolvable-demo...")
    for algo in ["brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"]:
        try:
            res = solve_crossword(puzzle.grid, puzzle.words, algo)
            print(f"{algo}: solved={res['solved']}, steps={len(res['steps'])}")
        except Exception as e:
            print(f"{algo} FAILED with exception: {e}")
else:
    print("unsolvable-demo not found")
