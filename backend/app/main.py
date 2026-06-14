import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from app.models import SolveRequest, SolveResponse, ComparisonResult, PuzzleDefinition
from app.data.puzzles import puzzles, find_puzzle
from app.algorithms.solver import solve_crossword
from app.algorithms.generator import generate_puzzle

app = FastAPI(
    title="Crossword Puzzle Solver",
    description="Python FastAPI backend powering the DAA Crossword Solver",
    version="1.0.0"
)

# Enable CORS for the React frontend (Vite port 5173 or 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "project": "Crossword Puzzle Solver",
        "algorithm": "Backtracking + CSP + Forward Checking",
        "language": "Python FastAPI"
    }

@app.get("/api/puzzles")
def list_puzzles():
    result = []
    for p in puzzles:
        # Exclude the solution grid from the public list
        p_dict = p.dict(exclude={"solution"})
        result.append(p_dict)
    return result

@app.get("/api/puzzles/{puzzle_id}")
def get_puzzle(puzzle_id: str):
    puzzle = find_puzzle(puzzle_id)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found.")
    return puzzle.dict(exclude={"solution"})

@app.post("/api/solve")
def solve(req: SolveRequest):
    algo = req.algorithm
    # Normalize old algorithm identifiers from the frontend to the new unified names
    if algo == "csp":
        algo = "backtracking-fc"  # mapping old MRV (without FC) to Backtracking + FC
    elif algo == "forward-checking" or not algo:
        algo = "backtracking-fc-mrv"  # mapping old FC (with MRV) to Backtracking + FC + MRV

    if algo not in ("brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"):
        algo = "backtracking-fc-mrv"

    try:
        res = solve_crossword(req.grid, req.words, algo, diagonal=req.diagonal or False)
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/compare")
def compare(req: SolveRequest):
    algorithms = ["brute-force", "backtracking", "backtracking-fc", "backtracking-fc-mrv"]
    results = []
    for algo in algorithms:
        try:
            res = solve_crossword(req.grid, req.words, algo, diagonal=req.diagonal or False)
            results.append({
                "algorithm": algo,
                "solved": res["solved"],
                "statistics": res["statistics"]
            })
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Comparison failed for {algo}: {str(e)}")
    return results

@app.get("/api/generate")
def generate(
    seed: Optional[int] = None,
    difficulty: Optional[str] = "Medium",
    size: Optional[int] = 5,
    theme: Optional[str] = "General CS"
):
    if seed is None:
        seed = int(time.time() * 1000)
    
    try:
        puz = generate_puzzle(seed, difficulty, size, theme)
        return puz.dict(exclude={"solution"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
