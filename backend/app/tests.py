import sys
import os
import unittest

# Adjust path to import app modules correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.algorithms.slot_detection import detect_slots
from app.algorithms.csp import create_crossword_csp
from app.algorithms.constraints import words_compatible, is_consistent
from app.algorithms.solver import solve_crossword
from app.algorithms.generator import generate_puzzle
from app.models import Position, Slot

class TestCrosswordAlgorithms(unittest.TestCase):

    def test_diagonal_slot_detection(self):
        # 5x5 grid with some diagonal patterns
        # DDR starting at (0,0) of length 3: open cells at (0,0), (1,1), (2,2)
        # Block cell at (3,3) to block the diagonal
        grid = [
            ["", "#", "#", "#", "#"],
            ["#", "", "#", "#", "#"],
            ["#", "#", "", "#", "#"],
            ["#", "#", "#", "#", "#"],
            ["#", "#", "#", "#", "#"]
        ]
        slots = detect_slots(grid, diagonal=True)
        
        # Check DDR slots detected
        ddr_slots = [s for s in slots if s.direction == "diagonal-down-right"]
        self.assertTrue(len(ddr_slots) >= 1)
        
        # Check cell coordinates of the DDR slot starting at (0,0)
        ddr_0_0 = next((s for s in ddr_slots if s.start.row == 0 and s.start.column == 0), None)
        self.assertIsNotNone(ddr_0_0)
        self.assertEqual(ddr_0_0.length, 3)
        self.assertEqual(ddr_0_0.cells[0], Position(row=0, column=0))
        self.assertEqual(ddr_0_0.cells[1], Position(row=1, column=1))
        self.assertEqual(ddr_0_0.cells[2], Position(row=2, column=2))

    def test_consistency_and_uniqueness(self):
        grid = [
            ["#", "#", "", "#", "#"],
            ["B", "I", "T", "E", "S"],
            ["#", "#", "", "#", "#"],
            ["C", "A", "C", "H", "E"],
            ["#", "#", "", "#", "#"]
        ]
        csp = create_crossword_csp(grid, ["STACK", "BITES", "CACHE"])
        
        # STACK is vertical down middle
        slot_stack = next(s for s in csp.slots if s.id == "D-0-2")
        assignments = {"A-1-0": "BITES", "A-3-0": "CACHE"}
        
        # STACK is compatible (T matches BITES[2]=T, C matches CACHE[2]=C)
        self.assertTrue(is_consistent(slot_stack, "STACK", assignments, csp.intersections))
        
        # BITES is consistent if assigned but we cannot assign it twice (violates uniqueness)
        self.assertFalse(is_consistent(slot_stack, "BITES", assignments, csp.intersections))

    def test_solve_algorithms(self):
        # 5x5 stack-basics predefined puzzle
        grid = [
            ["#", "#", "", "#", "#"],
            ["", "", "", "", ""],
            ["#", "#", "", "#", "#"],
            ["", "", "", "", ""],
            ["#", "#", "", "#", "#"]
        ]
        words = ["STACK", "BITES", "CACHE", "PRUNE", "NODES", "INNER"]
        
        algos = ["brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"]
        for algo in algos:
            res = solve_crossword(grid, words, algo)
            self.assertTrue(res["solved"], f"Failed to solve with {algo}")
            # Check solution grid
            self.assertEqual(res["grid"][1], ["B", "I", "T", "E", "S"])
            self.assertEqual(res["grid"][3], ["C", "A", "C", "H", "E"])

    def test_forward_checking_removals(self):
        # 5x5 double cross layout
        grid = [
            ["#", "", "#", "", "#"],
            ["", "", "", "", ""],
            ["#", "", "#", "", "#"],
            ["", "", "", "", ""],
            ["#", "", "#", "", "#"]
        ]
        # Distractors clashing at intersections
        words = ["LOGIC", "DEPTH", "NODES", "NINTH", "CACHE", "STACK", "PRUNE"]
        
        # Run solver with backtracking-fc and examine steps
        res = solve_crossword(grid, words, "backtracking-fc")
        self.assertTrue(res["solved"])
        
        # Check if we recorded any forward check removals > 0
        self.assertTrue(res["statistics"]["forwardCheckRemovals"] > 0)
        
        # Check steps trace contains FORWARD_CHECK events with non-zero removals
        fc_steps = [s for s in res["steps"] if s["type"] == "FORWARD_CHECK"]
        self.assertTrue(len(fc_steps) > 0)
        
        # At least one step should report removing candidate words due to mismatch
        any_removals = any(s.get("removedCandidates", 0) > 0 for s in fc_steps)
        self.assertTrue(any_removals)

    def test_generator_reproducible(self):
        first = generate_puzzle(1234, "Hard", 5, "General CS")
        second = generate_puzzle(1234, "Hard", 5, "General CS")
        self.assertEqual(first.solution, second.solution)
        self.assertEqual(first.words, second.words)

if __name__ == "__main__":
    unittest.main()
