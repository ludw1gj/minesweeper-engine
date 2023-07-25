export type MinesweeperState = Readonly<{
  /** The difficulty of the game. */
  difficulty: Difficulty;
  /** The game grid. */
  board: Grid;
  /** The previously saved grid state. */
  savedBoard?: Grid;
  /** The number to seed RandomNumberGenerator */
  randSeed: number;
}>;

/** Contains the state for a minesweeper game. */
export type Minesweeper = MinesweeperState & {
  cellCounts: {
    revealed: number;
    flagged: number;
    detonated: number;
    total: number;
  };
  status: GameStatus;
  remainingFlags: number;
};

/** The status of a cell. */
export type CellStatus = "hidden" | "flagged" | "revealed" | "detonated";

/** A cell of a minesweeper game. */
export type Cell = Readonly<{
  /** The status of the cell. */
  status: CellStatus;
  /** The amount of adjacent mines surrounding the cell. Is `-1` if cell is a mine. */
  mineCount: number;
}>;

/** An x-y point of a grid. */
export type Point = Readonly<{
  x: number;
  y: number;
}>;

/** The minesweeper game's difficulty level. */
export type Difficulty = Readonly<{
  height: number;
  width: number;
  mines: number;
}>;

/** The current status of the game. */
export type GameStatus = "waiting" | "ready" | "running" | "loss" | "win";

export type MutableGrid = Cell[];

/** A grid made up of cells. */
export type Grid = Readonly<MutableGrid>;

/** Generates a random number from a seed number. */
export type RandomNumberGenerator = (max?: number, min?: number) => number;
