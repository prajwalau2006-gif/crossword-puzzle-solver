import time
import math
from typing import List, Dict, Any, Optional
from app.models import PuzzleDefinition, Grid, Position
from app.data.puzzles import puzzles

# Word Databases per Theme
WORD_DATABASE_CS = [
    "ALGORITHM", "BACKTRACK", "COMPLEXITY", "STRUCTURE", "RECURSION", "REDUCTION", "OPTIMIZATION",
    "DYNAMICS", "SIMPLEX", "HEURISTIC", "TRAVERSAL", "SATISFIABILITY", "NPCOMPLETE", "VARIABLES",
    "DOMAINS", "CONSTRAINTS", "PRUNING", "SEARCH", "BRANCH", "BOUND", "QUEUE", "STACK", "GRAPH",
    "TREE", "HEAP", "HASH", "LINK", "EDGE", "PATH", "CODE", "DATA", "FILE", "SORT", "GRID", "LOOP",
    "MERGE", "QUERY", "VERTEX", "MATRIX", "BINARY", "LINEAR", "MEMORY", "BUFFER", "THREAD",
    "POINTER", "NETWORK", "ROUTING", "RUNTIME", "DATABASE", "COMPILER", "FUNCTION", "CONSTANT",
    "LOGIC", "STATE", "TRACE", "SOLVE", "TOKEN", "VALID", "ERROR", "INDEX", "CACHE", "ARRAY",
    "COLLISION", "BUCKET", "ANALYSIS", "ASYMPTOTIC", "AUTOMATON", "GRAMMAR", "COMPUTATION",
    "TURING", "HALTING", "POLYNOMIAL", "EXPONENTIAL", "LOGARITHMIC", "QUADRATIC"
]

WORD_DATABASE_DAA = [
    "ALGORITHM", "BUBBLE", "SELECTION", "SORT", "ANALYSIS", "EFFICIENCY", "RECURSIVE", "DIVIDE",
    "CONQUER", "MERGE", "QUICKSORT", "STRASSEN", "DECREASE", "INSERTION", "DEPTH", "BREADTH",
    "SEARCH", "TOPOLOGICAL", "DFS", "BFS", "TRANSFORM", "HEAPSORT", "REDUCTION", "TRADEOFFS",
    "COUNTING", "MATCHING", "HORSPOOL", "BOYER", "MOORE", "DYNAMIC", "PROGRAMMING", "BINOMIAL",
    "WARSHALL", "FLOYD", "KNAPSACK", "GREEDY", "PRIM", "DIJKSTRA", "HUFFMAN", "FRACTIONAL",
    "BACKTRACKING", "QUEENS", "SUM", "SUBSET", "BRANCH", "BOUND", "TRAVELING", "SALESPERSON",
    "DECISION", "TREES", "NPCOMPLETE", "NPHARD", "LIMITS", "HEURISTICS", "DECIDABILITY"
]

def seeded_random(seed: int):
    state = seed & 0xFFFFFFFF
    def rand():
        nonlocal state
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        return state / 4294967296
    return rand

def shuffle(array: List[Any], rand_fn) -> List[Any]:
    result = list(array)
    for i in range(len(result) - 1, 0, -1):
        j = int(rand_fn() * (i + 1))
        result[i], result[j] = result[j], result[i]
    return result

def get_target_word_count(size: int, difficulty: str) -> int:
    if size == 5:
        return 3 if difficulty == "Easy" else 4 if difficulty == "Medium" else 5
    if size == 10:
        return 5 if difficulty == "Easy" else 8 if difficulty == "Medium" else 11
    # 15 or others
    return 7 if difficulty == "Easy" else 13 if difficulty == "Medium" else 18

def can_place_word(
    grid: List[List[str]],
    size: int,
    word: str,
    r: int,
    c: int,
    direction: str
) -> bool:
    length = len(word)
    if direction == "horizontal":
        if c < 0 or c + length > size or r < 0 or r >= size:
            return False
        # Cell before must be empty
        if c - 1 >= 0 and grid[r][c - 1] != "":
            return False
        # Cell after must be empty
        if c + length < size and grid[r][c + length] != "":
            return False

        for k in range(length):
            cell = grid[r][c + k]
            letter = word[k]
            if cell != "":
                if cell != letter:
                    return False
            else:
                # Vertical adjacents must be empty
                if r - 1 >= 0 and grid[r - 1][c + k] != "":
                    return False
                if r + 1 < size and grid[r + 1][c + k] != "":
                    return False
        return True
    else:
        if r < 0 or r + length > size or c < 0 or c >= size:
            return False
        # Cell before must be empty
        if r - 1 >= 0 and grid[r - 1][c] != "":
            return False
        # Cell after must be empty
        if r + length < size and grid[r + length][c] != "":
            return False

        for k in range(length):
            cell = grid[r + k][c]
            letter = word[k]
            if cell != "":
                if cell != letter:
                    return False
            else:
                # Horizontal adjacents must be empty
                if c - 1 >= 0 and grid[r + k][c - 1] != "":
                    return False
                if c + 1 < size and grid[r + k][c + 1] != "":
                    return False
        return True

def generate_puzzle(
    seed: int = 42,
    difficulty: str = "Medium",
    size: int = 5,
    theme: str = "General CS"
) -> PuzzleDefinition:
    rand = seeded_random(seed)
    db = WORD_DATABASE_DAA if theme == "DAA Syllabus" else WORD_DATABASE_CS
    
    # Filter candidates by length constraints
    candidates = [w.upper() for w in db if 3 <= len(w) <= size]
    
    # Try multiple layout attempts
    for attempt in range(15):
        shuffled_words = shuffle(candidates, rand)
        grid = [["" for _ in range(size)] for _ in range(size)]
        placed_words = []

        first_word = next((w for w in shuffled_words if len(w) <= size), None)
        if not first_word:
            continue

        start_row = size // 2
        start_col = (size - len(first_word)) // 2
        for k in range(len(first_word)):
            grid[start_row][start_col + k] = first_word[k]
            
        placed_words.append({
            "word": first_word,
            "r": start_row,
            "c": start_col,
            "direction": "horizontal"
        })

        target_count = get_target_word_count(size, difficulty)
        fail_streak = 0

        while len(placed_words) < target_count and fail_streak < 300:
            letter_cells = []
            for r in range(size):
                for c in range(size):
                    if grid[r][c] != "":
                        letter_cells.append({"r": r, "c": c, "char": grid[r][c]})

            if not letter_cells:
                break
                
            cell = letter_cells[int(rand() * len(letter_cells))]
            dirs = shuffle(["horizontal", "vertical"], rand)
            placed = False

            for direction in dirs:
                word_candidates = [w for w in shuffled_words if not any(pw["word"] == w for pw in placed_words)]

                for W in word_candidates:
                    indices = [idx for idx, char in enumerate(W) if char == cell["char"]]
                    shuffled_indices = shuffle(indices, rand)

                    for idx in shuffled_indices:
                        start_r = cell["r"] - idx if direction == "vertical" else cell["r"]
                        start_c = cell["c"] - idx if direction == "horizontal" else cell["c"]

                        if can_place_word(grid, size, W, start_r, start_c, direction):
                            for k in range(len(W)):
                                pr = start_r + k if direction == "vertical" else start_r
                                pc = start_c if direction == "vertical" else start_c + k
                                grid[pr][pc] = W[k]

                            placed_words.append({
                                "word": W,
                                "r": start_r,
                                "c": start_c,
                                "direction": direction
                            })
                            placed = True
                            break
                    if placed:
                        break
                if placed:
                    break

            if placed:
                fail_streak = 0
            else:
                fail_streak += 1

        min_words = 3 if size == 5 else 4 if size == 10 else 5
        if len(placed_words) >= min_words:
            # Output grid has '#' for blocked cells, and solved characters
            solution = [
                ["#" if cell == "" else cell for cell in row]
                for row in grid
            ]
            
            placed_only = [pw["word"] for pw in placed_words]
            remaining = [w for w in candidates if w not in placed_only]
            
            distractor_count = 8 if difficulty == "Hard" else 5
            selected_distractors = shuffle(remaining, rand)[:distractor_count]
            words_list = shuffle(placed_only + selected_distractors, rand)

            # Ensure diagonal solution words are added to allow solving in diagonal mode
            from app.algorithms.slot_detection import detect_slots
            diag_slots = detect_slots(solution, diagonal=True)
            for slot in diag_slots:
                word = "".join(solution[cell.row][cell.column] for cell in slot.cells)
                if word not in words_list:
                    words_list.append(word)

            # If difficulty is Hard and seed is divisible by 3, make it unsolvable by removing a placed word
            is_unsolvable = (difficulty == "Hard" and seed % 3 == 0)
            if is_unsolvable and placed_only:
                word_to_remove = placed_only[0]
                words_list = [w for w in words_list if w != word_to_remove]

            # Build blank start grid with some reveals
            blank_grid = [[ "#" if cell == "#" else "" for cell in row ] for row in solution]
            
            open_cells = []
            for r in range(size):
                for c in range(size):
                    if solution[r][c] != "#":
                        open_cells.append((r, c))

            reveal_count = 3 if difficulty == "Easy" else 1 if difficulty == "Medium" else 0
            shuffled_open = shuffle(open_cells, rand)
            for r, c in shuffled_open[:reveal_count]:
                blank_grid[r][c] = solution[r][c]

            return PuzzleDefinition(
                id=f"gen-{seed}",
                title=f"Generated {size}x{size} ({difficulty})",
                difficulty=difficulty,
                concept=f"Seeded random crossword ({theme})",
                grid=blank_grid,
                solution=solution,
                words=words_list,
                theme=theme
            )

    # Fallback to predefined if all attempts fail
    fallback = next((p for p in puzzles if p.difficulty == difficulty and len(p.grid) == size and p.theme == theme), puzzles[0])
    return fallback
