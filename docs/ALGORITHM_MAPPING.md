# Algorithm Mapping

This document maps the Phase 1 PDF methodology to the implementation.

| PDF requirement | Implementation module | Verification |
| --- | --- | --- |
| Grid represented as a 2D matrix | `backend/src/algorithms/grid.ts` | Grid validation tests |
| Empty and blocked cells | Shared `Cell` type | Request validation tests |
| Horizontal and vertical slot detection | `slotDetection.ts` | Slot detection tests |
| Slots as CSP variables | `csp.ts` | CSP model tests |
| Candidate words as domains | `domains.ts` | Length-filtering tests |
| Word-length constraint | `domains.ts` | Domain and solver tests |
| Intersection consistency | `constraints.ts` | Crossing-letter tests |
| Unique word usage | `constraints.ts` | Duplicate-word tests |
| Recursive backtracking | `solver.ts` | Solvable/unsolvable tests |
| Forward checking | `forwardChecking.ts` | Domain-reduction tests |
| Empty-domain branch pruning | `solver.ts` | Pruning statistics tests |
| Continue until solved or impossible | `solver.ts` | API integration tests |
| Permanent demonstration inputs | `data/puzzles.ts` | Solver parameterized tests |
| Automatic generation | `generator.ts` | Reproducibility test |
| Complexity comparison | `/api/compare` | Frontend comparison table |

## Implemented Strategies

| Strategy | Selection | Validation | Future-domain filtering |
| --- | --- | --- | --- |
| Brute force | Fixed order | At complete assignments | No |
| Backtracking | Fixed order | After each assignment | No |
| CSP | Minimum remaining values, then degree | After each assignment | No |
| CSP + forward checking | Minimum remaining values, then degree | After each assignment | Yes |

## Required Optimization Pipeline

The final solver follows this order:

1. Normalize and validate the grid and candidate words.
2. Detect every horizontal and vertical slot.
3. Build intersections between connected slots.
4. Initially filter each domain by word length and prefilled letters.
5. Select an unassigned slot.
6. Reject words that violate current constraints.
7. Temporarily assign a valid word.
8. Forward-check all affected future domains.
9. Prune immediately if any future domain becomes empty.
10. Recurse, or restore the domains and backtrack on failure.

## Metrics

The backend records:

- Execution time
- Recursive calls
- Candidate assignments attempted
- Successful assignments
- Constraint rejections
- Forward-check removals
- Pruned branches
- Backtracks
- Maximum recursion depth

These metrics demonstrate the reduction from the theoretical `m^n` search
space toward an effective `k^n`, where `k < m` after pruning.
