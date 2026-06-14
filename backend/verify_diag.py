import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from app.data.puzzles import puzzles
from app.algorithms.solver import solve_crossword

print('Puzzle'.ljust(35), 'Normal'.rjust(7), 'Diag'.rjust(6), 'FC_Rem'.rjust(8))
print('-' * 60)
fail_diag = []
for p in puzzles:
    r1 = solve_crossword(p.grid, p.words, 'backtracking-fc-mrv', diagonal=False)
    r2 = solve_crossword(p.grid, p.words, 'backtracking-fc-mrv', diagonal=True)
    normal_str = 'OK' if r1['solved'] else 'FAIL'
    diag_str = 'OK' if r2['solved'] else 'FAIL'
    if not r2['solved']:
        fail_diag.append(p.id)
    print(p.id.ljust(35), normal_str.rjust(7), diag_str.rjust(6), str(r2['statistics']['forwardCheckRemovals']).rjust(8))

print()
if fail_diag:
    print('Puzzles that FAIL in diagonal mode:', fail_diag)
else:
    print('All puzzles pass in diagonal mode! ✓')
