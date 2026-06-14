import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.algorithms.solver import solve_crossword

grid = [
    ["#", "#", "", "#", "#"],
    ["", "", "", "", ""],
    ["#", "#", "", "#", "#"],
    ["", "", "", "", ""],
    ["#", "#", "", "#", "#"]
]
words = ["STACK", "BITES", "CACHE", "PRUNE", "NODES", "INNER"]

res = solve_crossword(grid, words, "brute-force")
print("SOLVED:", res["solved"])
print("GRID:")
for r in res["grid"]:
    print(r)
print("\nSTEPS:")
for s in res["steps"]:
    print(s["type"], "-", s["message"])
