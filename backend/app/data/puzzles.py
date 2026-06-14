from typing import List, Optional, Dict
from app.models import PuzzleDefinition

# ═════════════════════════════════════════════════════════════════════════════
#  5×5 TEMPLATE A – "Classic Cross"
# ═════════════════════════════════════════════════════════════════════════════

class SeedA:
    def __init__(self, id: str, title: str, concept: str, vertical: str, upper: str, lower: str, extras: List[str], theme: str = "General CS"):
        self.id = id
        self.title = title
        self.concept = concept
        self.vertical = vertical
        self.upper = upper
        self.lower = lower
        self.extras = extras
        self.theme = theme

seedsA = [
    SeedA("stack-basics", "Stack Basics", "LIFO data structure", "STACK", "BITES", "CACHE", ["PRUNE", "NODES", "INNER"], "General CS"),
    SeedA("array-index", "Array Index", "Contiguous data storage", "ARRAY", "ERROR", "GRAPH", ["PRUNE", "INNER", "BOUND"], "General CS"),
    SeedA("graph-links", "Graph Links", "Vertices and edges", "GRAPH", "ARRAY", "DEPTH", ["INNER", "BOUND", "LOGIC"], "General CS"),
    SeedA("trace-path", "Trace a Path", "Following algorithm state", "TRACE", "ERROR", "CACHE", ["PRUNE", "INNER", "BOUND"], "General CS"),
    
    # 5x5 DAA syllabus additions
    SeedA("sort-bubble", "Bubble Sort", "Unit I: Selection & Bubble sort", "SORTA", "BOUND", "MERGE", ["DFS", "BFS", "TREES"], "DAA Syllabus"),
    SeedA("dfs-bfs", "Search DFS/BFS", "Unit II: Depth & Breadth search", "DFSST", "PRUNE", "STATE", ["HEAP", "HASH", "LINK"], "DAA Syllabus")
]

def make_solution_A(s: SeedA) -> List[List[str]]:
    return [
        ["#", "#", s.vertical[0], "#", "#"],
        list(s.upper),
        ["#", "#", s.vertical[2], "#", "#"],
        list(s.lower),
        ["#", "#", s.vertical[4], "#", "#"]
    ]

def make_blank_A(sol: List[List[str]], reveals: int) -> List[List[str]]:
    g = [[ "#" if cell == "#" else "" for cell in row ] for row in sol]
    coords = [(0, 2), (2, 2), (4, 2), (1, 0), (3, 4)]
    for r, c in coords[:reveals]:
        g[r][c] = sol[r][c]
    return g

easy_puzzles = []
for s in seedsA:
    sol = make_solution_A(s)
    easy_puzzles.append(PuzzleDefinition(
        id=s.id,
        title=s.title,
        difficulty="Easy",
        concept=s.concept,
        grid=make_blank_A(sol, 2),
        solution=sol,
        words=list(set([s.vertical, s.upper, s.lower] + s.extras)),
        theme=s.theme
    ))

# ═════════════════════════════════════════════════════════════════════════════
#  5×5 TEMPLATE B – "Double Cross"
# ═════════════════════════════════════════════════════════════════════════════

class SeedB:
    def __init__(self, id: str, title: str, difficulty: str, concept: str, d1: str, d2: str, h1: str, h2: str, extras: List[str], theme: str = "General CS"):
        self.id = id
        self.title = title
        self.difficulty = difficulty
        self.concept = concept
        self.d1 = d1
        self.d2 = d2
        self.h1 = h1
        self.h2 = h2
        self.extras = extras
        self.theme = theme

seedsMedium = [
    SeedB("prune-model", "Prune & Model", "Medium", "Search pruning meets CSP variable modeling", "PRUNE", "MODEL", "ARROW", "INNER", ["CACHE", "GRAPH", "SCOPE", "DEPTH", "NODES"], "General CS"),
    SeedB("logic-depth", "Logic & Depth", "Medium", "Constraint logic with depth-first search", "LOGIC", "DEPTH", "NODES", "NINTH", ["CACHE", "GRAPH", "PRUNE", "ARRAY", "STACK"], "General CS"),
    SeedB("state-trace", "State & Trace", "Medium", "State-space search with execution tracing", "STATE", "TRACE", "STORM", "STACK", ["CACHE", "PRUNE", "INNER", "SCOPE", "BOUND"], "General CS"),
    SeedB("graph-queue", "Graph & Queue", "Medium", "Graph BFS with queue management", "GRAPH", "QUEUE", "GROUP", "SPOUT", ["CACHE", "INNER", "NODES", "DEPTH", "ARRAY"], "General CS"),
    
    # 5x5 Medium DAA syllabus additions (using exactly length 5 words for template compatibility)
    SeedB("greedy-prim", "Greedy Prim", "Medium", "Unit IV: Greedy spanning trees", "GREED", "PRIMS", "FLOYD", "TREES", ["BOUND", "MERGE", "BFSST", "DFSST"], "DAA Syllabus"),
    SeedB("divide-conq", "Divide & Conq", "Medium", "Unit II: Divide & Conquer", "DIVID", "CONQR", "MERGE", "QUICK", ["HEAPA", "SORTA", "LINKS", "DFSST"], "DAA Syllabus")
]

seedsHard = [
    SeedB("conflict-backtrack", "Conflict & Backtrack", "Hard", "High-conflict search space showing rejections and backtracks", "STACK", "GRAPH", "STORM", "SCOPE", ["STASH", "GRASP", "SHARE", "SHORE", "SPARE", "SPORE", "SCALE"], "General CS"),
    SeedB("stack-graph-hard", "Stack ∩ Graph", "Hard", "Brute Force vs Forward Checking benchmark", "STACK", "GRAPH", "STORM", "SCOPE", ["STORE", "STORK", "STERN", "STRAY", "START", "SCRAP", "STOMP", "STRAP"], "General CS"),
    SeedB("trace-model-hard", "Trace ∩ Model", "Hard", "MRV degree heuristic on 4-intersection grid", "TRACE", "MODEL", "ARROW", "SCREW", ["ARSON", "ARTSY", "PRONE", "PROOF", "SCRAM", "SCENE", "SCONE", "SCOPE"], "General CS"),
    SeedB("prune-inner-hard", "Prune ∩ Inner", "Hard", "Maximum forward-checking cascade", "PRUNE", "INNER", "TRUNK", "INFER", ["BRAND", "TRAIN", "DRINK", "WRUNG", "INDEX", "ONSET", "INSET"], "General CS"),
    SeedB("unsolvable-demo", "Unsolvable Demo", "Hard", "Intentionally unsolvable constraints demo", "STACK", "GRAPH", "STORM", "SCOPE", ["STORE", "STORK", "STERN", "STRAY"], "General CS"),
    
    # 5x5 Hard DAA syllabus additions (using exactly length 5 words for template compatibility)
    SeedB("knap-greedy", "Knapsack Greedy", "Hard", "Unit IV: 0/1 Knapsack", "KNAPS", "GREED", "BOUND", "STATE", ["HEAPA", "SORTA", "DFSST", "BFSST"], "DAA Syllabus"),
    SeedB("np-hard-hard", "NP-Hard Class", "Hard", "Unit V: NP-Hard complexity classes", "NPHAR", "NPCOM", "LIMIT", "TREES", ["BOUND", "STATE", "DFSST", "BFSST"], "DAA Syllabus")
]

def make_solution_B(s: SeedB) -> List[List[str]]:
    return [
        ["#", s.d1[0], "#", s.d2[0], "#"],
        list(s.h1),
        ["#", s.d1[2], "#", s.d2[2], "#"],
        list(s.h2),
        ["#", s.d1[4], "#", s.d2[4], "#"]
    ]

def make_blank_B(sol: List[List[str]], reveals: int) -> List[List[str]]:
    g = [[ "#" if cell == "#" else "" for cell in row ] for row in sol]
    coords = [(0, 1), (0, 3), (1, 0), (4, 1), (4, 3)]
    for r, c in coords[:reveals]:
        g[r][c] = sol[r][c]
    return g

medium_puzzles = []
for s in seedsMedium:
    sol = make_solution_B(s)
    medium_puzzles.append(PuzzleDefinition(
        id=s.id,
        title=s.title,
        difficulty="Medium",
        concept=s.concept,
        grid=make_blank_B(sol, 1),
        solution=sol,
        words=list(set([s.d1, s.d2, s.h1, s.h2] + s.extras)),
        theme=s.theme
    ))

hard_puzzles = []
for s in seedsHard:
    sol = make_solution_B(s)
    hard_puzzles.append(PuzzleDefinition(
        id=s.id,
        title=s.title,
        difficulty="Hard",
        concept=s.concept,
        grid=make_blank_B(sol, 0),
        solution=sol,
        words=list(set([s.d1, s.d2, s.h1, s.h2] + s.extras)),
        theme=s.theme
    ))

def make_grid_from_solution(solution: List[List[str]]) -> List[List[str]]:
    return [[ "#" if cell == "#" else "" for cell in row ] for row in solution]

# ═════════════════════════════════════════════════════════════════════════════
#  10×10 and 15×15 PUZZLES (Syllabus focused)
# ═════════════════════════════════════════════════════════════════════════════

algo10EasySolution = [
    ["#", "#", "#", "#", "#", "C", "#", "#", "#", "#"],
    ["#", "#", "P", "#", "#", "O", "#", "#", "#", "#"],
    ["#", "#", "O", "#", "#", "N", "#", "#", "#", "#"],
    ["#", "#", "I", "#", "#", "Q", "U", "E", "R", "Y"],
    ["#", "#", "N", "#", "#", "U", "#", "#", "#", "#"],
    ["#", "#", "T", "O", "K", "E", "N", "#", "#", "#"],
    ["#", "#", "E", "#", "#", "R", "#", "#", "#", "#"],
    ["#", "#", "R", "#", "#", "I", "#", "#", "#", "#"],
    ["#", "#", "#", "L", "I", "N", "K", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "G", "#", "#", "#", "#"]
]

algo10MediumSolution = [
    ["#", "#", "#", "#", "#", "C", "#", "#", "#", "#"],
    ["#", "#", "P", "#", "C", "O", "D", "E", "#", "#"],
    ["F", "L", "O", "W", "#", "N", "#", "#", "G", "#"],
    ["#", "#", "I", "#", "#", "Q", "U", "E", "R", "Y"],
    ["#", "#", "N", "#", "#", "U", "#", "#", "A", "#"],
    ["#", "#", "T", "O", "K", "E", "N", "#", "P", "#"],
    ["#", "#", "E", "#", "#", "R", "#", "#", "H", "#"],
    ["#", "#", "R", "#", "#", "I", "#", "#", "#", "#"],
    ["#", "#", "#", "L", "I", "N", "K", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "G", "#", "#", "#", "#"]
]

algo10HardSolution = [
    ["#", "N", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "P", "#", "C", "O", "D", "E", "#", "#", "#"],
    ["#", "C", "#", "O", "#", "#", "#", "M", "#", "S"],
    ["B", "O", "U", "N", "D", "#", "H", "E", "A", "P"],
    ["#", "M", "#", "Q", "#", "#", "#", "R", "#", "U"],
    ["#", "P", "R", "U", "N", "I", "N", "G", "#", "R"],
    ["#", "L", "#", "E", "#", "#", "#", "E", "#", "I"],
    ["S", "E", "A", "R", "C", "H", "#", "#", "#", "O"],
    ["#", "T", "#", "#", "#", "#", "#", "#", "#", "U"],
    ["N", "E", "T", "W", "O", "R", "K", "#", "#", "S"]
]

branch15EasySolution = [
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "S", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "A", "#", "#", "O", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "S", "P", "U", "R", "I", "O", "U", "S"],
    ["#", "#", "#", "#", "#", "L", "#", "Y", "#", "#", "T", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "I", "#", "M", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "N", "#", "P", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "V", "E", "R", "T", "E", "X", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "A", "#", "O", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "R", "#", "T", "H", "R", "E", "A", "D", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "I", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "S", "T", "R", "U", "C", "T", "U", "R", "E", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"]
]

solver15MediumSolution = [
    ["#", "#", "#", "#", "#", "#", "C", "#", "#", "#", "#", "S", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "U", "#", "#", "#", "#", "O", "#", "#", "#"],
    ["#", "A", "R", "C", "H", "I", "T", "E", "C", "T", "U", "R", "E", "#", "#"],
    ["#", "#", "E", "#", "A", "#", "#", "#", "#", "#", "#", "T", "#", "#", "#"],
    ["#", "#", "C", "#", "L", "#", "V", "#", "#", "#", "D", "#", "#", "#", "G"],
    ["#", "#", "U", "#", "T", "#", "E", "#", "P", "O", "I", "N", "T", "E", "R"],
    ["#", "#", "R", "#", "I", "#", "R", "#", "#", "#", "J", "#", "#", "#", "A"],
    ["#", "#", "S", "#", "N", "E", "T", "W", "O", "R", "K", "#", "#", "#", "M"],
    ["#", "#", "I", "#", "G", "#", "E", "#", "#", "#", "S", "#", "#", "#", "M"],
    ["#", "#", "V", "#", "#", "#", "X", "#", "#", "#", "T", "#", "#", "#", "A"],
    ["#", "M", "E", "R", "G", "E", "#", "Q", "U", "E", "R", "Y", "#", "#", "R"],
    ["#", "#", "W", "#", "#", "#", "#", "#", "#", "#", "A", "#", "#", "#", "#"],
    ["#", "#", "A", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "A", "L", "G", "O", "R", "I", "T", "H", "M", "#", "#", "#", "#", "#"],
    ["#", "#", "K", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"]
]

branch15HardSolution = [
    ["B", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "G", "#", "V", "#"],
    ["A", "#", "#", "#", "L", "#", "#", "R", "#", "#", "A", "R", "R", "A", "Y"],
    ["C", "#", "#", "S", "O", "L", "V", "E", "#", "A", "#", "A", "#", "A", "#"],
    ["K", "#", "#", "#", "G", "#", "#", "D", "#", "R", "#", "P", "#", "I", "#"],
    ["T", "#", "#", "#", "A", "#", "#", "U", "#", "C", "#", "H", "E", "A", "P"],
    ["R", "#", "C", "#", "R", "#", "#", "C", "#", "H", "#", "#", "#", "B", "#"],
    ["A", "#", "O", "#", "I", "#", "#", "T", "#", "I", "#", "L", "#", "L", "#"],
    ["C", "O", "N", "S", "T", "R", "A", "I", "N", "T", "M", "O", "D", "E", "L"],
    ["K", "#", "Q", "#", "H", "#", "#", "O", "#", "E", "#", "G", "#", "S", "#"],
    ["E", "#", "U", "#", "M", "#", "#", "N", "#", "C", "#", "I", "#", "#", "#"],
    ["R", "#", "E", "#", "I", "#", "#", "#", "S", "T", "A", "C", "K", "#", "#"],
    ["#", "#", "R", "#", "C", "U", "T", "#", "#", "U", "#", "#", "#", "S", "#"],
    ["#", "#", "I", "#", "#", "#", "R", "#", "#", "R", "#", "#", "#", "O", "#"],
    ["R", "U", "N", "T", "I", "M", "E", "#", "N", "E", "T", "W", "O", "R", "K"],
    ["#", "#", "G", "#", "#", "#", "E", "#", "#", "#", "#", "#", "#", "T", "#"]
]

puzzles: List[PuzzleDefinition] = [
    *easy_puzzles,
    *medium_puzzles,
    *hard_puzzles,

    # 10x10 Predefined DAA Syllabus
    PuzzleDefinition(
        id="algorithm-fundamentals",
        title="Algorithm Fundamentals (10×10)",
        difficulty="Easy",
        concept="Selection & Bubble Sort, Basic Asymptotic Analysis (Unit I)",
        grid=make_grid_from_solution(algo10EasySolution),
        solution=algo10EasySolution,
        # Words map to Unit I/II syllabus
        words=["LOGIC", "QUERY", "PRUNING", "TOKEN", "LINK", "SELECTION", "BUBBLE", "SORT", "ANALYSIS", "EFFICIENCY"],
        theme="DAA Syllabus"
    ),
    PuzzleDefinition(
        id="recursive-search",
        title="Recursive Search (10×10)",
        difficulty="Medium",
        concept="Divide & Conquer, DFS, BFS (Unit II)",
        grid=make_grid_from_solution(algo10MediumSolution),
        solution=algo10MediumSolution,
        # Words map to Unit II syllabus
        words=["FLOW", "CODE", "LINK", "QUERY", "POINTER", "TOKEN", "GRAPH", "DFS", "BFS", "QUICKSORT", "MERGESORT", "TOPOLOGICAL"],
        theme="DAA Syllabus"
    ),
    PuzzleDefinition(
        id="constraint-analysis",
        title="Constraint Analysis (10×10)",
        difficulty="Hard",
        concept="Backtracking, Branch & Bound, NP-Hard (Unit V)",
        grid=make_grid_from_solution(algo10HardSolution),
        solution=algo10HardSolution,
        # Words map to Unit V syllabus
        words=["BOUND", "HEAP", "PRUNING", "SEARCH", "NETWORK", "NPCOMPLETE", "NQUEENS", "SUBSET", "TSP", "BRANCH", "BOUNDS", "HARD", "DECISION"],
        theme="DAA Syllabus"
    ),

    # 15x15 Predefined DAA Syllabus
    PuzzleDefinition(
        id="recursive-branch",
        title="Recursive Branch (15×15)",
        difficulty="Easy",
        concept="Space & Time Tradeoffs, Boyer-Moore, Horspool (Unit III)",
        grid=make_grid_from_solution(branch15EasySolution),
        solution=branch15EasySolution,
        # Words map to Unit III syllabus
        words=["SPURIOUS", "VERTEX", "THREAD", "STRUCTURE", "BOYER", "MOORE", "HORSPOOL", "HEAPSORT", "MATCHING", "TRADEOFFS"],
        theme="DAA Syllabus"
    ),
    PuzzleDefinition(
        id="optimization-lab",
        title="Constraint Solver (15×15)",
        difficulty="Medium",
        concept="Dynamic Programming, Warshall, Floyd, Knapsack (Unit IV)",
        grid=make_grid_from_solution(solver15MediumSolution),
        solution=solver15MediumSolution,
        # Words map to Unit IV syllabus
        words=["ARCHITECTURE", "POINTER", "NETWORK", "MERGE", "QUERY", "ALGORITHM", "WARSHALL", "FLOYD", "KNAPSACK", "DIJKSTRA", "PRIMS", "GREEDY", "HUFFMAN"],
        theme="DAA Syllabus"
    ),
    PuzzleDefinition(
        id="backtrack-solver",
        title="Backtrack Solver (15×15)",
        difficulty="Hard",
        concept="Decision Trees, Sum of Subset, Backtracking optimizations (Unit V)",
        grid=make_grid_from_solution(branch15HardSolution),
        solution=branch15HardSolution,
        # Words map to Unit V syllabus
        words=["BACKTRACK", "ARRAY", "SOLVE", "HEAP", "RUNTIME", "NETWORK", "DECISION", "TREES", "SUBSET", "NPCOMPLETE", "NQUEENS", "BOUND", "SALESPERSON"],
        theme="DAA Syllabus"
    )
]

def populate_all_solution_words():
    from app.algorithms.slot_detection import detect_slots
    for p in puzzles:
        if p.id == "unsolvable-demo":
            p.words = [w for w in p.words if w != "GRAPH"]
            continue

        if p.solution:
            all_slots = detect_slots(p.solution, diagonal=True)
            for slot in all_slots:
                word = "".join(p.solution[cell.row][cell.column] for cell in slot.cells)
                if word not in p.words:
                    p.words.append(word)

            # Make selected predefined 10x10 and 15x15 puzzles unsolvable
            if p.id == "constraint-analysis":
                p.words = [w for w in p.words if w != "NPCOMPLETE"]
            elif p.id == "backtrack-solver":
                p.words = [w for w in p.words if w != "CONSTRAINTMODEL"]

populate_all_solution_words()

def find_puzzle(puzzle_id: str) -> Optional[PuzzleDefinition]:
    for p in puzzles:
        if p.id == puzzle_id:
            return p
    return None
