import { describe, expect, it } from "vitest";
import { createCrosswordCsp } from "./csp.js";
import { normalizeGrid } from "./grid.js";
import { detectSlots } from "./slotDetection.js";

describe("normalizeGrid", () => {
  it("normalizes prefilled letters", () => {
    expect(normalizeGrid([["a", ""], ["#", "b"]])).toEqual([
      ["A", ""],
      ["#", "B"],
    ]);
  });

  it("rejects non-rectangular grids", () => {
    expect(() => normalizeGrid([["", ""], [""]])).toThrow(
      "inconsistent length",
    );
  });
});

describe("detectSlots", () => {
  it("detects horizontal and vertical slots with their cells", () => {
    const grid = [
      ["", "", "#"],
      ["", "", ""],
      ["#", "", ""],
    ];

    const slots = detectSlots(grid);

    expect(
      slots.map(({ id, direction, length }) => ({ id, direction, length })),
    ).toEqual([
      { id: "A-0-0", direction: "across", length: 2 },
      { id: "D-0-0", direction: "down", length: 2 },
      { id: "D-0-1", direction: "down", length: 3 },
      { id: "A-1-0", direction: "across", length: 3 },
      { id: "D-1-2", direction: "down", length: 2 },
      { id: "A-2-1", direction: "across", length: 2 },
    ]);
  });
});

describe("createCrosswordCsp", () => {
  it("builds length-filtered domains and intersections", () => {
    const csp = createCrosswordCsp(
      [
        ["C", ""],
        ["", ""],
      ],
      ["cat", "car", "on", "at", "no"],
    );

    expect(csp.slots).toHaveLength(4);
    expect(csp.intersections).toHaveLength(4);
    expect(csp.domains.get("A-0-0")).toEqual([]);
    expect(csp.domains.get("D-0-0")).toEqual([]);
    expect(csp.domains.get("A-1-0")).toEqual(["ON", "AT", "NO"]);
  });
});

