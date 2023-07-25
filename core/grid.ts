import {
  CELL_DETONATED,
  CELL_FLAGGED_MAP,
  CELL_HIDDEN_MAP,
  CELL_REVEALED_MAP,
  POINT_DELTAS,
} from "./constants.ts";
import { Grid, MutableGrid, Point, RandomNumberGenerator } from "./types.ts";

/** Generate initial grid of hidden cells. */
export function generateInitialGrid(rows: number, cols: number): MutableGrid {
  const cell = CELL_HIDDEN_MAP.get(0)!;
  return Array.from({ length: rows * cols }, () => cell);
}

export function countMines(grid: Grid) {
  let minesAmt = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].mineCount === -1) {
      minesAmt++;
    }
  }
  return minesAmt;
}

/** Generates random mine points, lays mines, and lays mine counts. */
export function deployMines(
  grid: MutableGrid,
  mineNum: number,
  randSeed: number,
  width: number,
  seedPoint: Point,
): void {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed);
  const height = grid.length / width;
  const mine = CELL_HIDDEN_MAP.get(-1)!;

  let layedMines = 0;
  while (layedMines !== mineNum) {
    let mineIndex: number | undefined;
    while (!mineIndex) {
      const randPoint = {
        x: Math.floor(randomNumberGenerator() * width),
        y: Math.floor(randomNumberGenerator() * height),
      };
      const isSmallGrid = height < 4 && width < 4;
      const minDistance = isSmallGrid ? 1 : 2;
      const distance = findPointDistance(seedPoint, randPoint);
      if (distance < minDistance) {
        continue;
      }
      mineIndex = width * randPoint.y + randPoint.x;
    }

    const canLay = grid[mineIndex].mineCount !== -1;
    if (canLay) {
      grid[mineIndex] = mine;
      layedMines++;
    }
  }

  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (cell.mineCount === -1) {
      continue;
    }

    const y = Math.floor(i / width);
    const x = i % width;
    let mineCount = 0;
    for (let j = 0; j < POINT_DELTAS.length; j++) {
      const delta = POINT_DELTAS[j];
      const adjY = y + delta.y;
      const adjX = x + delta.x;
      const adjCell = grid[width * adjY + adjX];
      if (adjY >= width || adjX >= height || adjCell?.mineCount !== -1) {
        continue;
      }
      mineCount++;
    }

    if (mineCount > 0) {
      grid[i] = CELL_HIDDEN_MAP.get(mineCount)!;
    }
  }
}

/** Toggle the flag value of cell at the given point. */
export function toggleFlagPoint(
  grid: MutableGrid,
  width: number,
  point: Point,
): void {
  const cell = grid[width * point.y + point.x];
  const canToggle = cell?.status === "hidden" ||
    cell?.status === "flagged";
  if (!canToggle) {
    return;
  }

  const map = cell.status === "hidden" ? CELL_FLAGGED_MAP : CELL_HIDDEN_MAP;
  grid[width * point.y + point.x] = map.get(cell.mineCount)!;
}

/** Reveal cell at the given point. */
export function revealPoint(
  grid: MutableGrid,
  width: number,
  point: Point,
): void {
  const cellIndex = width * point.y + point.x;
  const cell = grid[cellIndex];
  if (!cell || cell.status === "revealed") {
    return;
  }

  const isLoss = cell.mineCount === -1;
  if (isLoss) {
    revealAllPoints(grid, cellIndex);
    return;
  }

  revealNeighborPoints(grid, width, point);
  const isWin = checkGridWin(grid);
  if (isWin) {
    revealAllPoints(grid);
  }
}

/** Reveal all cells. */
function revealAllPoints(grid: MutableGrid, detonatedIndex?: number): void {
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (i === detonatedIndex) {
      grid[i] = CELL_DETONATED;
      continue;
    }
    if (cell.status !== "revealed") {
      grid[i] = CELL_REVEALED_MAP.get(cell.mineCount)!;
    }
  }
}

/** Reveal adjacent cells of the given point if it has a zero mine count.
 * The given point is also revealed. */
function revealNeighborPoints(
  grid: MutableGrid,
  width: number,
  point: Point,
): void {
  const height = grid.length / width;
  const queue: number[] = [width * point.y + point.x];
  const adjIndexes: number[] = [];

  while (queue.length) {
    const currIndex = queue.shift()!;
    const cell = grid[currIndex];
    if (
      !cell ||
      adjIndexes.find((i) => i === currIndex)
    ) {
      continue;
    }

    adjIndexes.push(currIndex);
    if (cell.mineCount !== 0) {
      continue;
    }

    const y = Math.floor(currIndex / width);
    const x = currIndex % width;
    for (let j = 0; j < POINT_DELTAS.length; j++) {
      const delta = POINT_DELTAS[j];
      const adjY = y + delta.y;
      const adjX = x + delta.x;
      if (adjY >= width || adjX >= height) {
        continue;
      }
      const adjIndex = width * adjY + adjX;
      const adjCell = grid[adjIndex];
      if (adjCell) {
        queue.push(adjIndex);
      }
    }
  }

  for (let i = 0; i < adjIndexes.length; i++) {
    const adjIndex = adjIndexes[i];
    const cell = grid[adjIndex];
    if (cell.status === "revealed") {
      continue;
    }
    grid[adjIndex] = CELL_REVEALED_MAP.get(cell.mineCount)!;
  }
}

/** Check if the given grid has been won */
function checkGridWin(grid: MutableGrid): boolean {
  let mineOrRevealedAmt = 0;
  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    if (cell.status === "revealed" || cell.mineCount === -1) {
      mineOrRevealedAmt++;
    }
  }
  return grid.length === mineOrRevealedAmt;
}

/** Find the integer distance of two given points. */
function findPointDistance(
  pointA: Point,
  pointB: Point,
): number {
  const distanceX = Math.abs(pointB.x - pointA.x);
  const distanceY = Math.abs(pointB.y - pointA.y);
  const min = Math.min(distanceX, distanceY);
  const max = Math.max(distanceX, distanceY);
  const diagonalSteps = min;
  const straightSteps = max - min;
  return Math.sqrt(2) * diagonalSteps + straightSteps;
}

/** Create a random number generator callback. */
function createRandomNumberGenerator(
  seed: number,
): RandomNumberGenerator {
  if (seed === 0) {
    console.warn("seed cannot be 0, defaulting to 1");
  }
  let seedDecendent = seed || 1;
  return (max = 1, min = 0) => {
    seedDecendent = (seedDecendent * 9301 + 49297) % 233280;
    const rnd = seedDecendent / 233280;
    return min + rnd * (max - min);
  };
}
