import { useEffect, useMemo, useState } from "react";

type Grid = string[][];
type Algorithm =
  | "brute-force"
  | "backtracking"
  | "csp"
  | "forward-checking";

interface Puzzle {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  concept: string;
  grid: Grid;
  words: string[];
}

interface Statistics {
  algorithm: Algorithm;
  executionTimeMs: number;
  recursiveCalls: number;
  attemptedAssignments: number;
  constraintRejections: number;
  forwardCheckRemovals: number;
  prunedBranches: number;
  backtracks: number;
  maximumDepth: number;
  initialSearchSpace: string;
  exploredStates: number;
}

interface SolverStep {
  type: string;
  message: string;
  depth: number;
  slotId?: string;
  word?: string;
  grid?: Grid;
  removedCandidates?: number;
}

interface SolveResult {
  solved: boolean;
  grid: Grid;
  steps: SolverStep[];
  statistics: Statistics;
}

interface Comparison {
  algorithm: Algorithm;
  solved: boolean;
  statistics: Statistics;
}

const algorithmDetails: Record<
  Algorithm,
  { label: string; description: string; time: string; space: string }
> = {
  "brute-force": {
    label: "Brute force",
    description: "Fixed slot order; checks constraints only after all n slots are filled.",
    time: "O(mⁿ)",
    space: "O(n)",
  },
  backtracking: {
    label: "Backtracking",
    description: "Prunes on constraint violation immediately; no domain copies needed.",
    time: "O(mⁿ) worst case",
    space: "O(n)",
  },
  csp: {
    label: "CSP + MRV",
    description: "Picks the slot with fewest candidates first; domains stored read-only.",
    time: "O(mⁿ) worst case",
    space: "O(n·m)",
  },
  "forward-checking": {
    label: "CSP + Forward Checking",
    description: "Clones and prunes domains after each assignment; n copies on the call stack.",
    time: "O(mⁿ) worst, O(kⁿ) typical",
    space: "O(n²·m)",
  },
};

const cloneGrid = (grid: Grid) => grid.map((row) => [...row]);

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "The request failed.");
  }
  return body as T;
}

export function App() {
  const [view, setView] = useState<"home" | "permanent" | "generated" | "about" | "manual">("home");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [grid, setGrid] = useState<Grid>([]);
  const [wordsText, setWordsText] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("forward-checking");
  const [result, setResult] = useState<SolveResult | null>(null);
  const [comparison, setComparison] = useState<Comparison[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [blockMode, setBlockMode] = useState(false);
  const [difficulty, setDifficulty] =
    useState<Puzzle["difficulty"]>("Medium");
  const [genSize, setGenSize] = useState(5);
  const [manualSize, setManualSize] = useState(10);
  const [uploadSuccess, setUploadSuccess] = useState("");

  const initializeBlankGrid = (size: number) => {
    const blank: Grid = Array.from({ length: size }, () => Array(size).fill(""));
    setGrid(blank);
    setWordsText("");
    setResult(null);
    setComparison([]);
    setStepIndex(0);
    setError("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(content);
          handleJsonUpload(parsed);
        } else {
          handleTxtUpload(content);
        }
        setUploadSuccess(`Successfully loaded "${file.name}"!`);
        setTimeout(() => setUploadSuccess(""), 4000);
      } catch (err: any) {
        setError(err.message ?? "Error parsing uploaded file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleJsonUpload = (data: any) => {
    if (!data.grid || !Array.isArray(data.grid) || !data.words || !Array.isArray(data.words)) {
      throw new Error("Invalid JSON crossword file format. Must contain 'grid' and 'words' arrays.");
    }
    const cleanGrid = data.grid.map((row: any) =>
      row.map((cell: any) => (cell === "#" ? "#" : cell ? cell.toUpperCase().slice(-1) : ""))
    );
    setGrid(cleanGrid);
    setWordsText(data.words.join("\n"));
    setResult(null);
    setComparison([]);
    setStepIndex(0);
    setError("");
    autoCompare(cleanGrid, data.words);
  };

  const handleTxtUpload = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim());
    const separatorIdx = lines.indexOf("");
    
    let gridLines: string[] = [];
    let uploadWords: string[] = [];
    
    if (separatorIdx === -1) {
      gridLines = lines.filter(line => line.includes("#") || line.includes("."));
      uploadWords = lines.filter(line => !line.includes("#") && !line.includes(".") && line.length > 0);
    } else {
      gridLines = lines.slice(0, separatorIdx).filter(Boolean);
      uploadWords = lines.slice(separatorIdx + 1).filter(Boolean);
    }
    
    if (gridLines.length === 0) {
      throw new Error("No grid lines found in TXT file. Use '#' for blocks and '.' for empty spaces.");
    }
    
    const parsedGrid: Grid = gridLines.map(line => {
      const cells = line.includes(" ") ? line.split(/\s+/) : line.split("");
      return cells.map(cell => {
        if (cell === "#") return "#";
        if (cell === "." || cell === "") return "";
        return cell.toUpperCase().slice(-1);
      });
    });
    
    const colCount = parsedGrid[0]?.length ?? 0;
    if (parsedGrid.some(row => row.length !== colCount)) {
      throw new Error("TXT grid is not rectangular. Check row lengths.");
    }
    
    setGrid(parsedGrid);
    setWordsText(uploadWords.join("\n"));
    setResult(null);
    setComparison([]);
    setStepIndex(0);
    setError("");
    autoCompare(parsedGrid, uploadWords);
  };

  const exportPuzzle = () => {
    try {
      const data = {
        grid,
        words,
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `custom-crossword-${grid.length}x${grid.length}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setUploadSuccess("Successfully exported puzzle JSON!");
      setTimeout(() => setUploadSuccess(""), 4000);
    } catch (err) {
      setError("Failed to export puzzle.");
    }
  };

  const words = useMemo(
    () =>
      wordsText
        .split(/[\s,]+/)
        .map((word) => word.trim().toUpperCase())
        .filter(Boolean),
    [wordsText],
  );

  const activeStep = result?.steps[stepIndex];
  const playbackGrid = useMemo(() => {
    if (!result) return null;
    for (let index = stepIndex; index >= 0; index -= 1) {
      const snapshot = result.steps[index]?.grid;
      if (snapshot) return snapshot;
    }
    return grid;
  }, [grid, result, stepIndex]);
  const displayedGrid = playbackGrid ?? grid;

  const autoCompare = async (targetGrid: Grid, targetWords: string[]) => {
    if (targetGrid.length === 0 || targetWords.length === 0) return;
    try {
      const comparisonData = await api<Comparison[]>("/api/compare", {
        method: "POST",
        body: JSON.stringify({ grid: targetGrid, words: targetWords }),
      });
      setComparison(comparisonData);
    } catch (caught) {
      console.error("Auto-compare failed:", caught);
    }
  };

  const loadPuzzle = (puzzle: Puzzle) => {
    setSelectedId(puzzle.id);
    setGrid(cloneGrid(puzzle.grid));
    setWordsText(puzzle.words.join("\n"));
    setResult(null);
    setComparison([]);
    setStepIndex(0);
    setError("");
    autoCompare(puzzle.grid, puzzle.words);
  };

  useEffect(() => {
    api<Puzzle[]>("/api/puzzles")
      .then((items) => {
        setPuzzles(items);
        if (items[0]) loadPuzzle(items[0]);
      })
      .catch((caught: Error) => setError(caught.message));
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === "1") {
        setView("home");
      } else if (event.key === "2") {
        setView("permanent");
      } else if (event.key === "3") {
        setView("generated");
      } else if (event.key === "4") {
        setView("manual");
        setGrid(prev => prev.length === 0 ? Array.from({ length: 10 }, () => Array(10).fill("")) : prev);
      } else if (event.key === "5") {
        setView("about");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const solve = async () => {
    setBusy("solve");
    setError("");
    try {
      const solved = await api<SolveResult>("/api/solve", {
        method: "POST",
        body: JSON.stringify({ grid, words, algorithm }),
      });
      setResult(solved);
      setStepIndex(Math.max(0, solved.steps.length - 1));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to solve.");
    } finally {
      setBusy("");
    }
  };

  const compare = async () => {
    setBusy("compare");
    setError("");
    try {
      setComparison(
        await api<Comparison[]>("/api/compare", {
          method: "POST",
          body: JSON.stringify({ grid, words }),
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to compare.");
    } finally {
      setBusy("");
    }
  };

  const generate = async () => {
    setBusy("generate");
    setError("");
    try {
      const generated = await api<Puzzle>(
        `/api/generate?difficulty=${difficulty}&size=${genSize}&seed=${Date.now()}`,
      );
      loadPuzzle(generated);
      setView("generated");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate.");
    } finally {
      setBusy("");
    }
  };

  const updateCell = (row: number, column: number, value: string) => {
    const next = cloneGrid(grid);
    next[row]![column] = value.replace(/[^a-z]/gi, "").slice(-1).toUpperCase();
    setGrid(next);
    setResult(null);
  };

  const toggleBlock = (row: number, column: number) => {
    if (!blockMode) return;
    const next = cloneGrid(grid);
    next[row]![column] = next[row]![column] === "#" ? "" : "#";
    setGrid(next);
    setResult(null);
  };

  // Shared component for the main solver panel
  const renderSolverPanel = () => {
    return (
      <section className="solver card" style={{ flexGrow: 1 }}>
        <div className="solver-toolbar">
          <div>
            <p className="eyebrow">Interactive grid</p>
            <h2>Build and solve</h2>
          </div>
          <button
            className={`tool-button ${blockMode ? "selected" : ""}`}
            onClick={() => setBlockMode((enabled) => !enabled)}
          >
            {blockMode ? "Block tool on" : "Edit blocks"}
          </button>
        </div>

        <div className="solver-content">
          <div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${displayedGrid[0]?.length ?? 1}, 1fr)`,
              }}
            >
              {displayedGrid.flatMap((row, rowIndex) => {
                const cellStyle = {
                  fontSize:
                    displayedGrid.length > 10
                      ? "clamp(0.5rem, 1.4vw, 0.9rem)"
                      : displayedGrid.length > 5
                        ? "clamp(0.8rem, 2.2vw, 1.4rem)"
                        : undefined,
                  borderRadius:
                    displayedGrid.length > 10
                      ? "3px"
                      : displayedGrid.length > 5
                        ? "4px"
                        : undefined,
                };
                return row.map((cell, columnIndex) =>
                  cell === "#" ? (
                    <button
                      className="cell blocked"
                      key={`${rowIndex}-${columnIndex}`}
                      onClick={() => toggleBlock(rowIndex, columnIndex)}
                      style={cellStyle}
                      aria-label="Blocked cell"
                    />
                  ) : (
                    <input
                      className={`cell ${activeStep?.grid ? "playback" : ""}`}
                      key={`${rowIndex}-${columnIndex}`}
                      value={cell}
                      maxLength={1}
                      readOnly={Boolean(activeStep?.grid) || blockMode}
                      onClick={() => toggleBlock(rowIndex, columnIndex)}
                      onChange={(event) =>
                        updateCell(rowIndex, columnIndex, event.target.value)
                      }
                      style={cellStyle}
                      aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
                    />
                  ),
                );
              })}
            </div>
            <p className="grid-hint">
              Type letters directly. Enable "Edit blocks" to toggle blocked cells. 
              <br />
              <small style={{ color: "#8a4f2b", display: "block", marginTop: "4px" }}>
                ⚠️ Custom blocks change slot lengths. Add matching candidate words to avoid "No solution"!
              </small>
            </p>
          </div>

          <div className="controls">
            <label>
              Algorithm
              <select
                value={algorithm}
                onChange={(event) =>
                  setAlgorithm(event.target.value as Algorithm)
                }
              >
                {Object.entries(algorithmDetails).map(([value, detail]) => (
                  <option key={value} value={value}>
                    {detail.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="algorithm-note">
              {algorithmDetails[algorithm].description}
            </p>
            <label>
              Candidate words <span>{words.length}</span>
              <textarea
                value={wordsText}
                onChange={(event) => {
                  setWordsText(event.target.value);
                  setResult(null);
                }}
              />
            </label>
            <div className="action-row">
              <button className="primary" onClick={solve} disabled={Boolean(busy)}>
                {busy === "solve" ? "Solving..." : "Run solver"}
              </button>
              <button onClick={compare} disabled={Boolean(busy)}>
                {busy === "compare" ? "Comparing..." : "Compare all"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Shared component for solver results (trace and metrics)
  const renderResultsPanel = () => {
    if (!result) return null;
    return (
      <section className="results">
        <div className="card trace-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Algorithm trace</p>
              <h2>{result.solved ? "Solution found" : "No solution"}</h2>
            </div>
            <span className={`result-badge ${result.solved ? "success" : ""}`}>
              {stepIndex + 1} / {result.steps.length}
            </span>
          </div>
          <input
            className="step-range"
            type="range"
            min={0}
            max={Math.max(0, result.steps.length - 1)}
            value={stepIndex}
            onChange={(event) => setStepIndex(Number(event.target.value))}
          />
          
          <div className="step" style={{ minHeight: "auto", marginBottom: "16px" }}>
            <span style={{ fontWeight: 800 }}>ACTIVE STEP: {activeStep?.type.replaceAll("_", " ")}</span>
            <p style={{ margin: "6px 0 0" }}>{activeStep?.message}</p>
          </div>

          <div className="depth-visualizer">
            <span style={{ fontSize: "0.78rem", color: "#656e69", fontWeight: 700 }}>
              Recursion Depth: {activeStep?.depth ?? 0} (Max: {result.statistics.maximumDepth})
            </span>
            <div className="depth-bar-container">
              <div 
                className="depth-bar" 
                style={{ width: `${Math.min(100, ((activeStep?.depth ?? 0) / Math.max(1, result.statistics.maximumDepth)) * 100)}%` }} 
              />
            </div>
          </div>

          <p className="eyebrow" style={{ marginTop: "18px", marginBottom: "6px" }}>Recent Event Log Feed</p>
          <div className="trace-feed">
            {result.steps.slice(0, stepIndex + 1).slice(-5).map((step, idx) => (
              <div className={`feed-item ${step.type}`} key={idx}>
                <div className="type">{step.type.replaceAll("_", " ")}</div>
                <div className="msg">{step.message}</div>
              </div>
            ))}
          </div>

          <div className="step-buttons">
            <button
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={stepIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={() =>
                setStepIndex((index) =>
                  Math.min(result.steps.length - 1, index + 1),
                )
              }
              disabled={stepIndex >= result.steps.length - 1}
            >
              Next step
            </button>
          </div>
        </div>

        <div className="card metrics-card">
          <p className="eyebrow">Measured performance</p>
          <h2>{algorithmDetails[result.statistics.algorithm].label}</h2>
          <div className="metrics">
            <Metric label="Execution" value={`${result.statistics.executionTimeMs} ms`} />
            <Metric label="Recursive calls" value={result.statistics.recursiveCalls} />
            <Metric label="Assignments tried" value={result.statistics.attemptedAssignments} />
            <Metric label="Rejected" value={result.statistics.constraintRejections} />
            <Metric label="Domain removals" value={result.statistics.forwardCheckRemovals} />
            <Metric label="Pruned branches" value={result.statistics.prunedBranches} />
            <Metric label="Backtracks" value={result.statistics.backtracks} />
            <Metric label="Initial search" value={result.statistics.initialSearchSpace} />
          </div>
        </div>
      </section>
    );
  };

  // Shared component for the comparison table
  const renderComparisonPanel = () => {
    return (
      <section className="card comparison-card" style={{ marginTop: "24px" }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Complexity comparison</p>
            <h2>Theory meets measurement</h2>
          </div>
          <p>n = slots, m = candidates, k = pruned branching factor</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Time complexity</th>
                <th>Space</th>
                <th>Calls</th>
                <th>Attempts</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(algorithmDetails) as Algorithm[]).map((name) => {
                const measured = comparison.find((item) => item.algorithm === name);
                return (
                  <tr key={name}>
                    <td><strong>{algorithmDetails[name].label}</strong></td>
                    <td>{algorithmDetails[name].time}</td>
                    <td>{algorithmDetails[name].space}</td>
                    <td>{measured?.statistics.recursiveCalls ?? "—"}</td>
                    <td>{measured?.statistics.attemptedAssignments ?? "—"}</td>
                    <td>
                      {measured ? `${measured.statistics.executionTimeMs} ms` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <main>
      <nav className="navbar">
        <div className="nav-logo">
          <span>🧩</span> Crossword DAA Lab
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${view === "home" ? "active" : ""}`}
            onClick={() => setView("home")}
          >
            Home <span className="shortcut-badge">1</span>
          </button>
          <button
            className={`nav-link ${view === "permanent" ? "active" : ""}`}
            onClick={() => setView("permanent")}
          >
            Select Predefined Puzzle <span className="shortcut-badge">2</span>
          </button>
          <button
            className={`nav-link ${view === "generated" ? "active" : ""}`}
            onClick={() => {
              setView("generated");
              if (!selectedId.startsWith("generated-")) {
                generate();
              }
            }}
          >
            Dynamic Generator <span className="shortcut-badge">3</span>
          </button>
          <button
            className={`nav-link ${view === "manual" ? "active" : ""}`}
            onClick={() => {
              setView("manual");
              setSelectedId("manual");
              initializeBlankGrid(10);
            }}
          >
            Manual Grid Entry <span className="shortcut-badge">4</span>
          </button>
          <button
            className={`nav-link ${view === "about" ? "active" : ""}`}
            onClick={() => setView("about")}
          >
            Algorithm Guide <span className="shortcut-badge">5</span>
          </button>
        </div>
      </nav>

      {error && <div className="error">{error}</div>}
      {uploadSuccess && (
        <div className="upload-success-toast">
          <span className="toast-icon">✨</span>
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* View 1: Home page */}
      {view === "home" && (
        <div style={{ marginTop: "24px" }}>
          <header className="hero" style={{ marginBottom: "28px" }}>
            <div>
              <p className="eyebrow">Design and Analysis of Algorithms</p>
              <h1>Crossword Solver Lab</h1>
              <p className="lead">
                Solve, generate, inspect, and compare recursive search algorithms
                as they work through crossword constraints.
              </p>
            </div>
            <div className="hero-stat">
              <strong>18</strong>
              <span>Predefined DAA puzzles</span>
            </div>
          </header>

          <div className="home-grid">
            <div className="card nav-card" onClick={() => setView("permanent")}>
              <div className="icon">📚</div>
              <h3>Select Predefined Puzzle</h3>
              <p>
                Browse, solve, and analyze 18 handcrafted DAA-themed crossword puzzles. 
                Includes complexity tables, detailed step-by-step trace feeds, and interactive editing.
              </p>
              <div className="action-label">
                Go to Predefined Puzzles → <span className="shortcut-badge">2</span>
              </div>
            </div>

            <div className="card nav-card" onClick={() => {
              setView("generated");
              if (!selectedId.startsWith("generated-")) {
                generate();
              }
            }}>
              <div className="icon">⚙️</div>
              <h3>Dynamic Generator</h3>
              <p>
                Dynamically generate solvable, seeded crossword grids. Select between Easy (proper blocks), 
                Medium (moderate density), and Hard (dense overlaps) difficulties.
              </p>
              <div className="action-label">
                Go to Generator → <span className="shortcut-badge">3</span>
              </div>
            </div>

            <div className="card nav-card" onClick={() => {
              setView("manual");
              setSelectedId("manual");
              initializeBlankGrid(10);
            }}>
              <div className="icon">✍️</div>
              <h3>Manual Grid Entry</h3>
              <p>
                Design your own custom crossword grid, type letters, select blocks, 
                and add custom word domains. Upload JSON or TXT puzzle configurations directly.
              </p>
              <div className="action-label">
                Create Grid / Upload File → <span className="shortcut-badge">4</span>
              </div>
            </div>

            <div className="card nav-card" onClick={() => setView("about")}>
              <div className="icon">🧠</div>
              <h3>Algorithm Guide</h3>
              <p>
                Explore the theory behind the solver's engines. Learn about Brute Force, Backtracking, 
                Minimum Remaining Values (MRV), and Forward Checking domain filtering.
              </p>
              <div className="action-label">
                Read Guide → <span className="shortcut-badge">5</span>
              </div>
            </div>
          </div>

          <div className="shortcuts-footer">
            💡 <strong>Quick Navigation:</strong> Press the numbers <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd>, or <kbd>5</kbd> on your keyboard to instantly switch views.
          </div>
        </div>
      )}

      {/* View 2: Select Predefined Puzzle */}
      {view === "permanent" && (
        <div className="workspace" style={{ marginTop: "24px" }}>
          <aside className="sidebar card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Puzzle library</p>
                <h2>Select Predefined Puzzle</h2>
              </div>
              <span className="count">{puzzles.length}</span>
            </div>
            <div className="puzzle-list">
              {puzzles.map((puzzle) => (
                <button
                  className={`puzzle-item ${selectedId === puzzle.id ? "active" : ""}`}
                  key={puzzle.id}
                  onClick={() => loadPuzzle(puzzle)}
                >
                  <span>
                    <strong>{puzzle.title}</strong>
                    <small>{puzzle.concept} • {puzzle.grid.length}x{puzzle.grid[0]?.length ?? puzzle.grid.length}</small>
                  </span>
                  <em className={puzzle.difficulty.toLowerCase()}>
                    {puzzle.difficulty}
                  </em>
                </button>
              ))}
            </div>
          </aside>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
            {renderSolverPanel()}
            {renderResultsPanel()}
            {renderComparisonPanel()}
          </div>
        </div>
      )}

      {/* View 3: Seeded Generator */}
      {view === "generated" && (
        <div className="workspace" style={{ marginTop: "24px" }}>
          <aside className="sidebar card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Controls</p>
                <h2>Configure</h2>
              </div>
            </div>
            <div className="generator" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <p className="eyebrow">Automatic generator</p>
              <div className="generator-row" style={{ flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "9px" }}>
                  <select
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value as Puzzle["difficulty"])
                    }
                    style={{ flex: 1 }}
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                  <select
                    value={genSize}
                    onChange={(event) => setGenSize(Number(event.target.value))}
                    style={{ flex: 1 }}
                  >
                    <option value={5}>5x5 Grid</option>
                    <option value={10}>10x10 Grid</option>
                    <option value={15}>15x15 Grid</option>
                  </select>
                </div>
                <button
                  onClick={generate}
                  disabled={Boolean(busy)}
                  style={{ width: "100%" }}
                  className="primary"
                >
                  {busy === "generate" ? "Generating..." : "Generate Puzzle"}
                </button>
              </div>
            </div>
          </aside>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
            {renderSolverPanel()}
            {renderResultsPanel()}
            {renderComparisonPanel()}
          </div>
        </div>
      )}

      {/* View 4: Manual Grid Entry */}
      {view === "manual" && (
        <div className="workspace" style={{ marginTop: "24px" }}>
          <aside className="sidebar card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Controls</p>
                <h2>Design Grid</h2>
              </div>
            </div>

            <div className="generator" style={{ borderTop: "none", marginTop: 0, paddingTop: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>Grid Size</label>
                <div style={{ display: "flex", gap: "9px" }}>
                  <button
                    className={`tool-button ${grid.length === 5 ? "selected" : ""}`}
                    onClick={() => initializeBlankGrid(5)}
                    style={{ flex: 1 }}
                  >
                    5x5
                  </button>
                  <button
                    className={`tool-button ${grid.length === 10 ? "selected" : ""}`}
                    onClick={() => initializeBlankGrid(10)}
                    style={{ flex: 1 }}
                  >
                    10x10
                  </button>
                  <button
                    className={`tool-button ${grid.length === 15 ? "selected" : ""}`}
                    onClick={() => initializeBlankGrid(15)}
                    style={{ flex: 1 }}
                  >
                    15x15
                  </button>
                </div>
              </div>

              <div>
                <button
                  className="tool-button"
                  onClick={() => initializeBlankGrid(grid.length)}
                  style={{ width: "100%", justifyContent: "center", background: "#fdf8f4", border: "1px solid #e2c0b0", color: "#8a4f2b" }}
                >
                  🧹 Clear Grid
                </button>
              </div>

              <div style={{ borderTop: "1px solid #e5e5df", paddingTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>Upload Puzzle File</label>
                <p style={{ fontSize: "0.8rem", color: "#6d7772", marginBottom: "10px" }}>
                  Upload a <code>.json</code> or <code>.txt</code> crossword puzzle file.
                </p>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    id="puzzle-file-upload"
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="puzzle-file-upload"
                    className="file-upload-btn"
                  >
                    📁 Upload JSON/TXT
                  </label>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #e5e5df", paddingTop: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>Export/Save Puzzle</label>
                <p style={{ fontSize: "0.8rem", color: "#6d7772", marginBottom: "10px" }}>
                  Save your custom layout and words to a JSON file.
                </p>
                <button
                  onClick={exportPuzzle}
                  className="tool-button"
                  style={{ width: "100%", justifyContent: "center", background: "#f0f7f4", border: "1px solid #b8cfc1", color: "#185d45" }}
                >
                  📥 Export Puzzle JSON
                </button>
              </div>
            </div>
          </aside>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", flexGrow: 1 }}>
            {renderSolverPanel()}
            {renderResultsPanel()}
            {renderComparisonPanel()}
          </div>
        </div>
      )}

      {/* View 5: Algorithm Guide */}
      {view === "about" && (
        <div className="about-section" style={{ marginTop: "24px" }}>

          {/* Hero banner */}
          <div className="about-header">
            <p className="eyebrow" style={{ color: "#f2bd66" }}>Algorithm Guide & Documentation</p>
            <h2>How the Crossword DAA Lab Works</h2>
            <p>
              This interactive lab implements four recursive search algorithms applied to crossword constraint 
              satisfaction. Explore the technology stack, understand the workflow, learn how to use each feature, 
              and dive deep into the algorithmic theory.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="card algo-card">
            <p className="eyebrow">Technology Stack</p>
            <h3 className="section-title" style={{ marginBottom: "4px" }}>Tools & Technologies Used</h3>
            <p className="section-subtitle">The full-stack application is built with modern web technologies and a TypeScript runtime.</p>
            <div className="tech-stack-grid">
              <div className="tech-item">
                <div className="tech-icon">⚛️</div>
                <div className="tech-name">React 18</div>
                <div className="tech-role">Frontend UI library with hooks-based state management</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">⚡</div>
                <div className="tech-name">Vite</div>
                <div className="tech-role">Lightning-fast dev server with HMR and proxy support</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🔷</div>
                <div className="tech-name">TypeScript</div>
                <div className="tech-role">Full type safety across frontend and backend codebases</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🚀</div>
                <div className="tech-name">Express.js</div>
                <div className="tech-role">REST API server powering the solver and generator endpoints</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🛡️</div>
                <div className="tech-name">Zod</div>
                <div className="tech-role">Runtime schema validation for all API request payloads</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🧪</div>
                <div className="tech-name">Vitest</div>
                <div className="tech-role">Unit test framework with 29 passing tests across all algorithms</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🎨</div>
                <div className="tech-name">Vanilla CSS</div>
                <div className="tech-role">Custom design system with HSL colors, glassmorphism and animations</div>
              </div>
              <div className="tech-item">
                <div className="tech-icon">🐳</div>
                <div className="tech-name">Docker</div>
                <div className="tech-role">Containerised deployment via docker-compose for frontend + backend</div>
              </div>
            </div>
          </div>

          {/* How to Use - Workflow */}
          <div className="card algo-card">
            <p className="eyebrow">Step-by-Step Guide</p>
            <h3 className="section-title" style={{ marginBottom: "4px" }}>How to Use This Website</h3>
            <p className="section-subtitle">Follow this workflow to get the most out of the Crossword DAA Lab.</p>
            <div className="workflow-steps">
              <div className="workflow-step">
                <div className="step-num">1</div>
                <div className="step-content">
                  <h4>🏠 Start from the Home Page</h4>
                  <p>The Home page gives you a quick overview of all three sections. Click any navigation card or press keyboard shortcuts <kbd style={{ background: "#ecece5", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "monospace" }}>1</kbd>, <kbd style={{ background: "#ecece5", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "monospace" }}>2</kbd>, <kbd style={{ background: "#ecece5", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "monospace" }}>3</kbd>, <kbd style={{ background: "#ecece5", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "monospace" }}>4</kbd>, or <kbd style={{ background: "#ecece5", padding: "2px 6px", borderRadius: "4px", fontSize: "0.8rem", fontFamily: "monospace" }}>5</kbd> to instantly jump to any section.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">2</div>
                <div className="step-content">
                  <h4>📚 Browse Permanent Puzzles (Page 2)</h4>
                  <p>Select any of the 18 handcrafted DAA-themed crossword puzzles from the sidebar — spanning 5×5, 10×10, and 15×15 grids with Easy, Medium, and Hard difficulties. The puzzle loads into the interactive grid automatically.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <h4>✏️ Edit the Grid (Optional)</h4>
                  <p>Type letters directly into any open cell to pre-fill hints. Toggle the <strong>"Edit blocks"</strong> button to click cells and mark them as black blocks (■), which changes the word-slot boundaries. Note: if you add custom blocks, ensure your candidate word list has words that match the new slot lengths.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">4</div>
                <div className="step-content">
                  <h4>🔧 Choose an Algorithm & Run</h4>
                  <p>Select an algorithm from the dropdown (Brute Force, Backtracking, CSP + MRV, or Forward Checking). Click <strong>"Run solver"</strong> to solve the puzzle. The grid will fill in with the solution and a step-by-step trace will appear below.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">5</div>
                <div className="step-content">
                  <h4>🎬 Step Through the Trace</h4>
                  <p>Use the scrubber slider or the Previous/Next Step buttons to replay the algorithm's decisions. Watch the grid update in real-time as words are tried, assigned, rejected, or backtracked. The <strong>Event Log Feed</strong> shows the last 5 actions chronologically.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">6</div>
                <div className="step-content">
                  <h4>📊 Compare All Algorithms</h4>
                  <p>Click <strong>"Compare all"</strong> to run all four algorithms on the same puzzle simultaneously. The <strong>Complexity Comparison Table</strong> at the bottom shows measured statistics (calls, attempts, time) side-by-side so you can see how MRV and Forward Checking outperform Brute Force in practice.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">7</div>
                <div className="step-content">
                  <h4>⚙️ Generate Dynamic Puzzles (Page 3)</h4>
                  <p>Go to the <strong>Dynamic Generator</strong> page. Pick a difficulty (Easy/Medium/Hard) and grid size (5×5, 10×10, or 15×15). Click <strong>"Generate Puzzle"</strong>. A seeded crossword is built on-the-fly from a DAA word database — then you can solve, trace, and compare.</p>
                </div>
              </div>
              <div className="workflow-step">
                <div className="step-num">8</div>
                <div className="step-content">
                  <h4>✍️ Manual Grid Entry & Uploads (Page 4)</h4>
                  <p>Go to the <strong>Manual Grid Entry</strong> page. Select a grid size, click cells to toggle block layouts, and input candidate words. Or simply upload a puzzle configuration file in <code>.json</code> or <code>.txt</code> format to solve it instantly.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Tricks */}
          <div className="card algo-card">
            <p className="eyebrow">Pro Tips</p>
            <h3 className="section-title" style={{ marginBottom: "4px" }}>Things to Know</h3>
            <p className="section-subtitle">Get the best experience with these helpful notes.</p>
            <div className="tips-grid">
              <div className="tip-card highlight">
                <div className="tip-icon">⌨️</div>
                <h4>Keyboard Navigation</h4>
                <p>Press <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, <strong>4</strong>, or <strong>5</strong> on your keyboard (when not typing in a text field) to instantly switch between the five views.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🧩</div>
                <h4>Grid Size & Difficulty</h4>
                <p>Easy puzzles reveal 3 pre-filled letters. Medium reveals 1. Hard starts completely blank. Larger grids (15×15) have more word intersections, making them harder for Brute Force but manageable for Forward Checking.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">⚠️</div>
                <h4>Custom Blocks Warning</h4>
                <p>When you add custom block cells, the detected word slots change length. If your candidate words don't include words matching the new slot lengths, the solver will correctly report "No solution". Add words of the right length to fix this.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📈</div>
                <h4>Comparison Table</h4>
                <p>The comparison table auto-populates when you load or generate a puzzle. You can also click "Compare all" manually at any time to re-run all 4 algorithms and update the measured statistics.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🎯</div>
                <h4>Recursion Depth Bar</h4>
                <p>The green-to-orange depth bar in the trace panel shows how deep the current step is in the recursion tree relative to the maximum depth reached during the search.</p>
              </div>
              <div className="tip-card highlight">
                <div className="tip-icon">🔁</div>
                <h4>Reproducible Generation</h4>
                <p>Generated puzzles are <strong>seeded</strong> — the same seed always produces the same puzzle layout. This ensures reproducibility for demonstration and testing purposes.</p>
              </div>
            </div>
          </div>

          {/* Notation Legend */}
          <div className="card algo-card">
            <p className="eyebrow">Notation Key</p>
            <h3 className="section-title" style={{ marginBottom: "16px" }}>Understanding the Complexity Notation</h3>
            <div className="tips-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              <div className="tip-card highlight">
                <div className="tip-icon">🔢</div>
                <h4>n — Number of Slots</h4>
                <p>The total number of word slots (variables) detected in the crossword grid. A 5×5 has ~6 slots; a 15×15 can have 20+ slots.</p>
              </div>
              <div className="tip-card highlight">
                <div className="tip-icon">📚</div>
                <h4>m — Domain Size</h4>
                <p>The maximum number of candidate words that can fit in any single slot. This is the branching factor at each level of the search tree.</p>
              </div>
              <div className="tip-card highlight">
                <div className="tip-icon">✂️</div>
                <h4>k — Pruned Branching Factor</h4>
                <p>The effective branching factor after Forward Checking prunes incompatible candidates. Always k ≤ m, typically k ≪ m on real puzzles.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📐</div>
                <h4>O vs Θ</h4>
                <p><strong>O</strong> is an upper bound (worst case). <strong>Θ</strong> is a tight bound (both average best and worst). Forward Checking is O(mⁿ) worst case but Θ(kⁿ) typical.</p>
              </div>
            </div>
          </div>

          {/* Algorithms - split into 2-col grid */}
          <div>
            <p className="eyebrow" style={{ margin: "0 0 8px" }}>Algorithm Deep Dive</p>
            <h3 className="section-title" style={{ marginBottom: "20px" }}>The Four Solver Engines — Verified Complexity Analysis</h3>
            <div className="about-two-col">

              <div className="card algo-card">
                <h3>1. Plain Brute Force</h3>
                <p>
                  Assigns words to slots in a fixed order and only validates all crossword constraints 
                  <strong> after every single slot is filled</strong>. No pruning occurs during the search.
                </p>
                <ul style={{ marginTop: "10px", color: "#5a6360", fontSize: "0.88rem", lineHeight: 1.7, paddingLeft: "18px" }}>
                  <li><strong>Time:</strong> At each of <em>n</em> slots, we try all <em>m</em> candidates → m × m × … × m = <strong>m<sup>n</sup></strong> total states explored.</li>
                  <li><strong>Space:</strong> Only the recursion call stack (depth = n) is needed. No domain copies are made → <strong>O(n)</strong>.</li>
                </ul>
                <div className="algo-meta">
                  <span className="meta-tag time">Time: O(mⁿ) — exact worst case</span>
                  <span className="meta-tag space">Space: O(n)</span>
                </div>
              </div>

              <div className="card algo-card">
                <h3>2. Recursive Backtracking</h3>
                <p>
                  Assigns words one at a time in a fixed slot order, but checks intersection constraints 
                  <strong> immediately after each assignment</strong>. Rolls back (backtracks) on any conflict.
                </p>
                <ul style={{ marginTop: "10px", color: "#5a6360", fontSize: "0.88rem", lineHeight: 1.7, paddingLeft: "18px" }}>
                  <li><strong>Time:</strong> Worst case is still <strong>m<sup>n</sup></strong> (degenerate conflict-free tree). In practice much better due to early pruning on constraint violations.</li>
                  <li><strong>Space:</strong> Like Brute Force — only the assignment stack (depth = n), no domain snapshots → <strong>O(n)</strong>.</li>
                </ul>
                <div className="algo-meta">
                  <span className="meta-tag time">Time: O(mⁿ) worst case</span>
                  <span className="meta-tag space">Space: O(n)</span>
                </div>
              </div>

              <div className="card algo-card">
                <h3>3. CSP + Minimum Remaining Values (MRV)</h3>
                <p>
                  Same backtracking search but dynamically selects the <strong>slot with the fewest remaining valid candidates</strong> 
                  at each step (MRV heuristic). Degree heuristic breaks ties.
                </p>
                <ul style={{ marginTop: "10px", color: "#5a6360", fontSize: "0.88rem", lineHeight: 1.7, paddingLeft: "18px" }}>
                  <li><strong>Time:</strong> Worst case still <strong>m<sup>n</sup></strong>, but the smarter ordering detects failures far earlier, dramatically reducing states explored in practice.</li>
                  <li><strong>Space:</strong> All <em>n</em> domain lists (each of size ≤ m) must be kept in memory to determine MRV at each step → <strong>O(n·m)</strong>. Domains are <em>not</em> cloned — they are read-only.</li>
                </ul>
                <div className="algo-meta">
                  <span className="meta-tag time">Time: O(mⁿ) worst case</span>
                  <span className="meta-tag space">Space: O(n·m)</span>
                </div>
              </div>

              <div className="card algo-card">
                <h3>4. CSP + Forward Checking</h3>
                <p>
                  After assigning each word, <strong>immediately clones and filters the domains</strong> of all 
                  unassigned neighbouring slots. If any domain becomes empty, the branch is pruned before recursion continues.
                </p>
                <ul style={{ marginTop: "10px", color: "#5a6360", fontSize: "0.88rem", lineHeight: 1.7, paddingLeft: "18px" }}>
                  <li><strong>Time:</strong> Worst case O(m<sup>n</sup>). Typical case <strong>O(k<sup>n</sup>)</strong> where k &lt; m is the post-pruning branching factor. Each <code>forwardCheck()</code> call costs O(n·m) per assignment.</li>
                  <li><strong>Space:</strong> <code>cloneDomains()</code> creates a full O(n·m) snapshot at <em>every recursion level</em>. With recursion depth n, the call stack holds <em>n</em> snapshots → <strong>O(n·n·m) = O(n²·m)</strong>. This is higher than MRV but the time savings justify it.</li>
                </ul>
                <div className="algo-meta">
                  <span className="meta-tag time">Time: O(mⁿ) worst, O(kⁿ) typical</span>
                  <span className="meta-tag space">Space: O(n²·m) ← corrected</span>
                </div>
              </div>

            </div>
          </div>

          {/* Comparison summary table */}
          <div className="card algo-card">
            <p className="eyebrow">Summary</p>
            <h3 className="section-title" style={{ marginBottom: "16px" }}>Complexity at a Glance</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Variable Order</th>
                    <th>Constraint Check</th>
                    <th>Domain Propagation</th>
                    <th>Time (Worst)</th>
                    <th>Time (Typical)</th>
                    <th>Space</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Brute Force</strong></td>
                    <td>Fixed</td>
                    <td>After all n assigned</td>
                    <td>None</td>
                    <td>O(mⁿ)</td>
                    <td>O(mⁿ)</td>
                    <td>O(n)</td>
                  </tr>
                  <tr>
                    <td><strong>Backtracking</strong></td>
                    <td>Fixed</td>
                    <td>Per assignment</td>
                    <td>None</td>
                    <td>O(mⁿ)</td>
                    <td>&lt; O(mⁿ)</td>
                    <td>O(n)</td>
                  </tr>
                  <tr>
                    <td><strong>CSP + MRV</strong></td>
                    <td>Dynamic (MRV)</td>
                    <td>Per assignment</td>
                    <td>None</td>
                    <td>O(mⁿ)</td>
                    <td>≪ O(mⁿ)</td>
                    <td>O(n·m)</td>
                  </tr>
                  <tr style={{ background: "#edf4ef" }}>
                    <td><strong>Forward Checking</strong></td>
                    <td>Dynamic (MRV)</td>
                    <td>Per assignment</td>
                    <td>Domain clone + filter</td>
                    <td>O(mⁿ)</td>
                    <td>O(kⁿ), k≪m</td>
                    <td><strong>O(n²·m)</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: "14px", color: "#6d7772", fontSize: "0.85rem", lineHeight: 1.6 }}>
              <strong>Key insight:</strong> Forward Checking uses <em>more space</em> than MRV because it must clone the entire domain 
              map (n·m) at each of the n recursion levels. This space cost is the trade-off for its superior time performance — 
              by pruning dead branches before entering them, it achieves the fastest practical solve times.
            </p>
          </div>

          {/* CSP Concepts */}
          <div className="card algo-card">
            <p className="eyebrow">Core Concepts</p>
            <h3 className="section-title" style={{ marginBottom: "16px" }}>CSP Problem Formulation</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <div className="tip-icon">🔵</div>
                <h4>Variables (n)</h4>
                <p>Each word slot in the crossword grid is a <strong>CSP variable</strong>. A 5×5 grid typically has 6 slots; a 15×15 can have 20+ variables.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📋</div>
                <h4>Domains (m)</h4>
                <p>Each variable's <strong>domain</strong> is the list of candidate words that match its slot length and any pre-filled letter positions. <code>domains.ts</code> builds these on load.</p>
              </div>
              <div className="tip-card">
                <div className="tip-icon">🔗</div>
                <h4>Constraints</h4>
                <p>Two slots that share a cell form an <strong>intersection constraint</strong> — the crossing letter must match in both assigned words. All words must also be distinct.</p>
              </div>
              <div className="tip-card highlight">
                <div className="tip-icon">✅</div>
                <h4>Solution</h4>
                <p>A complete assignment of one word from each domain to its slot such that <em>every</em> intersection constraint is satisfied and no word is repeated.</p>
              </div>
            </div>
          </div>


        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
