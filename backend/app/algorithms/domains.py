from typing import List, Dict
from app.models import Slot

def build_initial_domains(
    grid: List[List[str]],
    slots: List[Slot],
    words: List[str],
) -> Dict[str, List[str]]:
    domains = {}
    for slot in slots:
        candidates = []
        for word in words:
            if len(word) != slot.length:
                continue
            
            # Ensure candidate word matches any pre-filled cells in the grid
            matches = True
            for idx, cell in enumerate(slot.cells):
                prefilled = grid[cell.row][cell.column]
                if prefilled != "" and prefilled != "#" and word[idx] != prefilled:
                    matches = False
                    break
            if matches:
                candidates.append(word)
        domains[slot.id] = candidates
    return domains
