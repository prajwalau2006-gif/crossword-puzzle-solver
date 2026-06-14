import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.data.puzzles import puzzles
from app.algorithms.solver import solve_crossword

print("Puzzle".ljust(25), "Algo".ljust(22), "Rejections".rjust(10), "Backtracks".rjust(10))
print("-" * 72)

for p in puzzles:
    for algo in ["brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"]:
        res = solve_crossword(p.grid, p.words, algo)
        rejections = res["statistics"]["constraintRejections"]
        backtracks = res["statistics"]["backtracks"]
        if rejections > 0 or backtracks > 0:
            print(p.id.ljust(25), algo.ljust(22), str(rejections).rjust(10), str(backtracks).rjust(10))
