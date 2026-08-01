export type Color = "red" | "green" | "yellow" | "blue";

export const COLORS: Color[] = ["red", "green", "yellow", "blue"];

// The 52-cell main track as [row, col] on a 15x15 grid, clockwise.
export const TRACK: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

// Global track indices that are safe (start squares + star squares).
export const SAFE = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);

export interface PlayerDef {
  start: number;
  home: [number, number][]; // 6 home-column cells leading to the centre
  base: { r0: number; c0: number }; // top-left of the 6x6 corner yard
  hex: string; // primary colour
  light: string; // lighter shade for the yard
  name: string;
}

export const PLAYERS: Record<Color, PlayerDef> = {
  red: {
    start: 0,
    home: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    base: { r0: 0, c0: 0 },
    hex: "#f43f5e", // Rose-Red vibrant premium
    light: "#fecdd3",
    name: "Rouge",
  },
  green: {
    start: 13,
    home: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    base: { r0: 0, c0: 9 },
    hex: "#10b981", // Emerald premium
    light: "#d1fae5",
    name: "Vert",
  },
  yellow: {
    start: 26,
    home: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    base: { r0: 9, c0: 9 },
    hex: "#f59e0b", // Amber Premium
    light: "#fef3c7",
    name: "Jaune",
  },
  blue: {
    start: 39,
    home: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
    base: { r0: 9, c0: 0 },
    hex: "#3b82f6", // Blue Royal premium
    light: "#dbeafe",
    name: "Bleu",
  },
};

// Yard slot offsets (centre coords within the 6x6 corner) for the 4 tokens.
export const YARD_SLOTS: [number, number][] = [
  [2, 2], [2, 4], [4, 2], [4, 4],
];

export const CELL = 100 / 15; // percent per cell

export interface Token {
  id: string;
  color: Color;
  slot: number; // 0..3
  state: "yard" | "active" | "done";
  progress: number; // 0..56 when active/done (56 = reached centre)
}

export const FINISH = 56;

// Centre coordinate (row, col) for a token.
export function tokenCoord(t: Token): { r: number; c: number } {
  const def = PLAYERS[t.color];
  if (t.state === "yard") {
    const [or, oc] = YARD_SLOTS[t.slot];
    return { r: def.base.r0 + or, c: def.base.c0 + oc };
  }
  if (t.progress <= 50) {
    const [row, col] = TRACK[(def.start + t.progress) % 52];
    return { r: row + 0.5, c: col + 0.5 };
  }
  const [row, col] = def.home[t.progress - 51];
  return { r: row + 0.5, c: col + 0.5 };
}

export function globalIndex(color: Color, progress: number): number {
  return (PLAYERS[color].start + progress) % 52;
}
