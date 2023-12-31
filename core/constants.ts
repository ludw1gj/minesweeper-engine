import { Cell, CellStatus, Point } from "./types.ts";

export const CELL_HIDDEN_MAP = createCellMap("hidden");

export const CELL_REVEALED_MAP = createCellMap("revealed");

export const CELL_FLAGGED_MAP = createCellMap("flagged");

export const CELL_DETONATED: Cell = {
  status: "detonated",
  mines: -1,
};

/** Adjacent deltas of a point. */
export const POINT_DELTAS: ReadonlyArray<Point> = [-1, 0, 1]
  .flatMap((y) => [-1, 0, 1].map((x) => ({ x, y })))
  .filter(({ x, y }) => !(x === 0 && y === 0));

function createCellMap(status: CellStatus): ReadonlyMap<number, Cell> {
  const map = new Map<number, Cell>();
  const maxMineCount = 8;
  for (let i = -1; i <= maxMineCount; i++) {
    map.set(i, {
      status,
      mines: i,
    });
  }
  return map;
}
