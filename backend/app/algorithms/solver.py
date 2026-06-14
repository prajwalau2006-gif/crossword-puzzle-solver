import time
import math
from typing import List, Dict, Any, Optional
from app.models import Grid, Slot, Position, SolveResponse, SolverStep, SolverStatistics
from app.algorithms.csp import create_crossword_csp, CrosswordCsp
from app.algorithms.constraints import is_consistent, words_compatible, Intersection

def search_space(domain_sizes: List[int]) -> str:
    product = 1
    for size in domain_sizes:
        product *= size
    if product > 1e12:
        logarithm = math.log10(product)
        return f"~10^{logarithm:.1f}"
    return f"{product:,}"

def render_assignments(grid: List[List[str]], slots_by_id: Dict[str, Slot], assignments: Dict[str, str]) -> List[List[str]]:
    result = [list(row) for row in grid]
    for slot_id, word in assignments.items():
        slot = slots_by_id.get(slot_id)
        if not slot:
            continue
        for idx, cell in enumerate(slot.cells):
            # Safe index check
            if idx < len(word):
                result[cell.row][cell.column] = word[idx]
    return result

def complete_assignment_is_valid(csp: CrosswordCsp, assignments: Dict[str, str]) -> bool:
    if len(set(assignments.values())) != len(assignments):
        return False
        
    for intersection in csp.intersections:
        w1 = assignments.get(intersection.first_slot_id)
        w2 = assignments.get(intersection.second_slot_id)
        if not w1 or not w2:
            return False
        
        if intersection.first_index >= len(w1) or intersection.second_index >= len(w2):
            return False

        if w1[intersection.first_index] != w2[intersection.second_index]:
            return False
            
    return True

def select_slot(
    csp: CrosswordCsp,
    assignments: Dict[str, str],
    domains: Dict[str, List[str]],
    algorithm: str,
) -> Optional[Slot]:
    unassigned = [slot for slot in csp.slots if slot.id not in assignments]
    if not unassigned:
        return None

    if algorithm in ("brute-force", "backtracking", "backtracking-fc"):
        return unassigned[0]

    # backtracking-fc-mrv uses MRV (tie-break by Degree Heuristic)
    def sort_key(slot: Slot) -> tuple:
        domain_len = len(domains.get(slot.id, []))
        
        # Degree (number of intersections involving this slot)
        degree = sum(
            1 for intersect in csp.intersections
            if intersect.first_slot_id == slot.id or intersect.second_slot_id == slot.id
        )
        # Sort by: 1. fewest domain candidates, 2. largest degree (break tie: most intersections)
        return (domain_len, -degree)

    unassigned.sort(key=sort_key)
    return unassigned[0]

def forward_check(
    csp: CrosswordCsp,
    assigned_slot: Slot,
    assigned_word: str,
    assignments: Dict[str, str],
    domains: Dict[str, List[str]],
) -> tuple:
    next_domains = {slot_id: list(words) for slot_id, words in domains.items()}
    removed = 0
    removed_details = {}
    failed = False

    for slot in csp.slots:
        if slot.id in assignments:
            continue

        current = next_domains.get(slot.id, [])
        filtered = []
        slot_removed = []
        for candidate in current:
            if candidate == assigned_word and len(candidate) > 2:
                removed += 1
                slot_removed.append(candidate)
                continue

            if words_compatible(assigned_slot.id, assigned_word, slot.id, candidate, csp.intersections):
                filtered.append(candidate)
            else:
                removed += 1
                slot_removed.append(candidate)

        next_domains[slot.id] = filtered
        if slot_removed:
            removed_details[slot.id] = slot_removed
        if not filtered:
            failed = True

    return next_domains, removed, removed_details, failed

def solve_crossword(
    grid: List[List[str]],
    words: List[str],
    algorithm: str = "backtracking-fc-mrv",
    diagonal: bool = False
) -> Dict[str, Any]:
    started_at = time.perf_counter()
    csp = create_crossword_csp(grid, words, diagonal)
    assignments: Dict[str, str] = {}
    slots_by_id = {slot.id: slot for slot in csp.slots}
    steps: List[Dict[str, Any]] = []
    
    # Init stats
    statistics = {
        "algorithm": algorithm,
        "executionTimeMs": 0.0,
        "recursiveCalls": 0,
        "attemptedAssignments": 0,
        "successfulAssignments": 0,
        "constraintRejections": 0,
        "forwardCheckRemovals": 0,
        "prunedBranches": 0,
        "backtracks": 0,
        "maximumDepth": 0,
        "initialSearchSpace": search_space([len(csp.domains.get(s.id, [])) for s in csp.slots]),
        "exploredStates": 0,
    }

    MAX_RECORDED_STEPS = 1000

    def record(step: Dict[str, Any]):
        if len(steps) < MAX_RECORDED_STEPS:
            steps.append(step)

    def search(depth: int, domains: Dict[str, List[str]]) -> bool:
        statistics["recursiveCalls"] += 1
        statistics["exploredStates"] += 1
        statistics["maximumDepth"] = max(statistics["maximumDepth"], depth)

        # Timeout / limits check (4 seconds timeout or 100,000 recursive calls)
        if statistics["recursiveCalls"] > 100000 or (time.perf_counter() - started_at) > 4.0:
            return False

        if len(assignments) == len(csp.slots):
            if algorithm == "brute-force" and not complete_assignment_is_valid(csp, assignments):
                statistics["constraintRejections"] += 1
                return False

            record({
                "type": "SOLVED",
                "message": "Every slot satisfies all crossword constraints.",
                "depth": depth,
                "grid": render_assignments(csp.grid, slots_by_id, assignments),
            })
            return True

        slot = select_slot(csp, assignments, domains, algorithm)
        if not slot:
            return False

        candidates = domains.get(slot.id, [])
        record({
            "type": "SELECT_SLOT",
            "message": f"Selected {slot.id} ({slot.direction}, {slot.length} cells) with {len(candidates)} candidates.",
            "depth": depth,
            "slotId": slot.id,
        })

        for word in candidates:
            statistics["attemptedAssignments"] += 1
            record({
                "type": "TRY_WORD",
                "message": f"Trying {word} in {slot.id}.",
                "depth": depth,
                "slotId": slot.id,
                "word": word,
            })

            # Check constraints early (except for brute force)
            if algorithm != "brute-force" and not is_consistent(slot, word, assignments, csp.intersections):
                statistics["constraintRejections"] += 1
                record({
                    "type": "REJECT_WORD",
                    "message": f"{word} violates an intersection or the unique-word constraint.",
                    "depth": depth,
                    "slotId": slot.id,
                    "word": word,
                })
                continue

            assignments[slot.id] = word
            statistics["successfulAssignments"] += 1

            next_domains = domains
            branch_failed = False
            removed = 0
            removed_details = {}

            if algorithm in ("backtracking-fc", "backtracking-fc-mrv"):
                next_domains, removed, removed_details, failed = forward_check(
                    csp, slot, word, assignments, domains
                )
                branch_failed = failed
                statistics["forwardCheckRemovals"] += removed

            fc_msg = ""
            if algorithm in ("backtracking-fc", "backtracking-fc-mrv"):
                if removed > 0:
                    details_list = []
                    for s_id, words_pruned in removed_details.items():
                        details_list.append(f"{s_id}: {', '.join(words_pruned)}")
                    fc_msg = f" Forward checking removed {removed} future candidates: {'; '.join(details_list)}."
                else:
                    fc_msg = " Forward checking removed 0 future candidates."

            record({
                "type": "ASSIGN_WORD",
                "message": f"Assigned {word} to {slot.id}.{fc_msg}",
                "depth": depth,
                "slotId": slot.id,
                "word": word,
                "grid": render_assignments(csp.grid, slots_by_id, assignments),
                "removedCandidates": removed,
            })

            if algorithm in ("backtracking-fc", "backtracking-fc-mrv"):
                record({
                    "type": "FORWARD_CHECK",
                    "message": f"Forward checking removed {removed} future candidates.{fc_msg.replace(' Forward checking removed ', ' Details: ') if removed > 0 else ''}",
                    "depth": depth,
                    "slotId": slot.id,
                    "word": word,
                    "removedCandidates": removed,
                })

            if branch_failed:
                statistics["prunedBranches"] += 1
                statistics["constraintRejections"] += 1
                record({
                    "type": "PRUNE_BRANCH",
                    "message": "A future domain is empty, so this branch is pruned.",
                    "depth": depth,
                    "slotId": slot.id,
                    "word": word,
                })
            elif search(depth + 1, next_domains):
                return True

            del assignments[slot.id]
            statistics["backtracks"] += 1
            record({
                "type": "BACKTRACK",
                "message": f"Removed {word} from {slot.id} and restored the previous state.",
                "depth": depth,
                "slotId": slot.id,
                "word": word,
                "grid": render_assignments(csp.grid, slots_by_id, assignments),
            })

        return False

    # Clone domains
    init_domains = {slot_id: list(words) for slot_id, words in csp.domains.items()}
    solved = search(0, init_domains)
    result_grid = render_assignments(csp.grid, slots_by_id, assignments)

    if not solved:
        record({
            "type": "NO_SOLUTION",
            "message": "The search space was exhausted without a valid assignment.",
            "depth": 0,
            "grid": result_grid,
        })

    statistics["executionTimeMs"] = round((time.perf_counter() - started_at) * 1000.0, 3)

    return {
        "solved": solved,
        "grid": result_grid,
        "steps": steps,
        "statistics": statistics
    }
