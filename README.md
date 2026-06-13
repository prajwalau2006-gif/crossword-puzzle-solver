# Crossword Puzzle Solver

An educational Design and Analysis of Algorithms project that solves crossword
puzzles using:

- Recursive backtracking
- Constraint Satisfaction Problem (CSP) modeling
- Domain filtering
- Forward checking
- Recursive branch pruning

## Project Structure

```text
backend/   Express API and crossword-solving algorithms
frontend/  React interface and step-by-step algorithm visualizer
docs/      Algorithm mapping, methodology, and project notes
```

## Features

- Four measurable strategies: brute force, recursive backtracking, CSP with
  minimum-remaining-values selection, and CSP with forward checking.
- Twelve permanent DAA-themed puzzles across three difficulty levels.
- Seeded automatic puzzle generation with adjustable difficulty.
- Interactive grid and word-bank editing.
- Step-by-step assignment, rejection, pruning, and backtracking playback.
- Runtime, recursive-call, assignment, rejection, pruning, and domain metrics.
- Side-by-side theoretical and empirical complexity comparison.

## Run Locally

To run the backend and frontend concurrently in development mode:

```bash
npm run dev
```

The React application runs at `http://localhost:5173` (or `http://localhost:5174` if port 5173 is occupied) and proxies API requests to the Express server at `http://localhost:5000`.

### Running with Docker

You can build and spin up the production-ready application services in containers with:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost` (port 80)
- **Backend API Service**: `http://localhost:5000`


## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service status |
| `GET` | `/api/puzzles` | Permanent puzzle catalog |
| `GET` | `/api/puzzles/:id` | One puzzle |
| `POST` | `/api/solve` | Solve with a selected algorithm |
| `POST` | `/api/compare` | Run all four algorithms |
| `GET` | `/api/generate` | Generate a seeded puzzle variant |

## Verification

```text
npm test
npm run build
```
