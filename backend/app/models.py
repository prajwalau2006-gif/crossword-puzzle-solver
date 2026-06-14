from pydantic import BaseModel, Field
from typing import List, Optional

Cell = str
Grid = List[List[Cell]]

class Position(BaseModel):
    row: int
    column: int

class Slot(BaseModel):
    id: str
    direction: str
    start: Position
    length: int
    cells: List[Position]

class SolveRequest(BaseModel):
    grid: List[List[str]]
    words: List[str]
    algorithm: Optional[str] = "backtracking-fc-mrv"
    diagonal: Optional[bool] = False

class SolverStep(BaseModel):
    type: str
    message: str
    depth: int
    slotId: Optional[str] = Field(None, alias="slotId")
    word: Optional[str] = None
    grid: Optional[List[List[str]]] = None
    removedCandidates: Optional[int] = Field(None, alias="removedCandidates")

    class Config:
        populate_by_name = True

class SolverStatistics(BaseModel):
    algorithm: str
    executionTimeMs: float = Field(..., alias="executionTimeMs")
    recursiveCalls: int = Field(..., alias="recursiveCalls")
    attemptedAssignments: int = Field(..., alias="attemptedAssignments")
    successfulAssignments: int = Field(..., alias="successfulAssignments")
    constraintRejections: int = Field(..., alias="constraintRejections")
    forwardCheckRemovals: int = Field(..., alias="forwardCheckRemovals")
    prunedBranches: int = Field(..., alias="prunedBranches")
    backtracks: int = Field(..., alias="backtracks")
    maximumDepth: int = Field(..., alias="maximumDepth")
    initialSearchSpace: str = Field(..., alias="initialSearchSpace")
    exploredStates: int = Field(..., alias="exploredStates")

    class Config:
        populate_by_name = True

class SolveResponse(BaseModel):
    solved: bool
    grid: List[List[str]]
    steps: List[SolverStep]
    statistics: SolverStatistics

class PuzzleDefinition(BaseModel):
    id: str
    title: str
    difficulty: str
    concept: str
    grid: List[List[str]]
    solution: Optional[List[List[str]]] = None
    words: List[str]
    theme: Optional[str] = "General CS"

class ComparisonResult(BaseModel):
    algorithm: str
    solved: bool
    statistics: SolverStatistics
