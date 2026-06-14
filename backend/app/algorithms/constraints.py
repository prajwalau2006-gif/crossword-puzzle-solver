from typing import List, Dict, Any, Set
from app.models import Slot

class Intersection:
    def __init__(self, first_slot_id: str, second_slot_id: str, first_index: int, second_index: int, position: Dict[str, int]):
        self.first_slot_id = first_slot_id
        self.second_slot_id = second_slot_id
        self.first_index = first_index
        self.second_index = second_index
        self.position = position

    def to_dict(self):
        return {
            "firstSlotId": self.first_slot_id,
            "secondSlotId": self.second_slot_id,
            "firstIndex": self.first_index,
            "secondIndex": self.second_index,
            "position": self.position
        }

def is_consistent(
    slot: Slot,
    word: str,
    assignments: Dict[str, str],
    intersections: List[Intersection],
) -> bool:
    # Check uniqueness (no word can be assigned twice, except short words like <= 2 chars)
    if len(word) > 2 and word in assignments.values():
        return False

    for intersection in intersections:
        if intersection.first_slot_id != slot.id and intersection.second_slot_id != slot.id:
            continue

        slot_is_first = intersection.first_slot_id == slot.id
        other_slot_id = intersection.second_slot_id if slot_is_first else intersection.first_slot_id
        other_word = assignments.get(other_slot_id)

        if not other_word:
            continue

        current_index = intersection.first_index if slot_is_first else intersection.second_index
        other_index = intersection.second_index if slot_is_first else intersection.first_index

        # Safety boundary checks
        if current_index >= len(word) or other_index >= len(other_word):
            return False

        if word[current_index] != other_word[other_index]:
            return False

    return True

def words_compatible(
    first_slot_id: str,
    first_word: str,
    second_slot_id: str,
    second_word: str,
    intersections: List[Intersection],
) -> bool:
    if len(first_word) > 2 and first_word == second_word:
        return False

    for intersection in intersections:
        forward = intersection.first_slot_id == first_slot_id and intersection.second_slot_id == second_slot_id
        reverse = intersection.first_slot_id == second_slot_id and intersection.second_slot_id == first_slot_id

        if not forward and not reverse:
            continue

        first_index = intersection.first_index if forward else intersection.second_index
        second_index = intersection.second_index if forward else intersection.first_index

        if first_index >= len(first_word) or second_index >= len(second_word):
            return False

        if first_word[first_index] != second_word[second_index]:
            return False

    return True
