from typing import List, Dict, Any
from app.models import Grid, Slot, Position
from app.algorithms.grid import normalize_grid, normalize_words
from app.algorithms.slot_detection import detect_slots
from app.algorithms.constraints import Intersection
from app.algorithms.domains import build_initial_domains

class CrosswordCsp:
    def __init__(self, grid: List[List[str]], slots: List[Slot], domains: Dict[str, List[str]], intersections: List[Intersection]):
        self.grid = grid
        self.slots = slots
        self.domains = domains
        self.intersections = intersections

def find_intersections(slots: List[Slot]) -> List[Intersection]:
    intersections = []
    
    for i in range(len(slots)):
        for j in range(i + 1, len(slots)):
            first_slot = slots[i]
            second_slot = slots[j]

            for first_idx, first_pos in enumerate(first_slot.cells):
                # Search for sharing coordinate
                for second_idx, second_pos in enumerate(second_slot.cells):
                    if first_pos.row == second_pos.row and first_pos.column == second_pos.column:
                        intersections.append(Intersection(
                            first_slot_id=first_slot.id,
                            second_slot_id=second_slot.id,
                            first_index=first_idx,
                            second_index=second_idx,
                            position={"row": first_pos.row, "column": first_pos.column}
                        ))
                        break
                        
    return intersections

def filter_duplicate_slots(slots: List[Slot], domains: Dict[str, List[str]]) -> List[Slot]:
    groups = {}
    for slot in slots:
        coords = tuple(sorted((c.row, c.column) for c in slot.cells))
        if coords not in groups:
            groups[coords] = []
        groups[coords].append(slot)
    
    filtered_slots = []
    for coords, slot_group in groups.items():
        if len(slot_group) == 1:
            filtered_slots.append(slot_group[0])
        else:
            best_slot = None
            # Find the first slot in the group that actually has matching candidate words
            for slot in slot_group:
                if len(domains.get(slot.id, [])) > 0:
                    best_slot = slot
                    break
            if not best_slot:
                # If no slot has candidates, default to a downward diagonal direction if available
                best_slot = next((s for s in slot_group if s.direction in ("diagonal-down-right", "diagonal-down-left")), slot_group[0])
            filtered_slots.append(best_slot)
    return filtered_slots

def create_crossword_csp(grid: List[List[str]], words: List[str], diagonal: bool = False) -> CrosswordCsp:
    normalized_grid = normalize_grid(grid)
    normalized_words = normalize_words(words)
    slots = detect_slots(normalized_grid, diagonal)

    if not slots:
        raise ValueError("The grid does not contain any word slots.")

    domains = build_initial_domains(normalized_grid, slots, normalized_words)
    
    if diagonal:
        slots = filter_duplicate_slots(slots, domains)
        domains = {slot.id: domains.get(slot.id, []) for slot in slots}

    intersections = find_intersections(slots)

    return CrosswordCsp(
        grid=normalized_grid,
        slots=slots,
        domains=domains,
        intersections=intersections
    )

