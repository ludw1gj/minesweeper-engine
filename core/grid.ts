import { Cell, MutableGrid, Point, RandomNumberGenerator } from "./types.ts";

/** Adjacent deltas of a point. */
const POINT_DELTAS: ReadonlyArray<Point> = [-1, 0, 1]
  .flatMap((y) => [-1, 0, 1].map((x) => ({ x, y })))
  .filter(({ x, y }) => !(x === 0 && y === 0));

/** Generate initial grid of hidden cells. */
export function generateInitialGrid(rows: number, cols: number): MutableGrid {
  const cell: Cell = {
    status: "hidden",
    mineCount: 0,
  };
  return Array.from({ length: rows * cols }, () => cell);
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
  const mine: Cell = {
    status: "hidden",
    mineCount: -1,
  };

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
    for (const delta of POINT_DELTAS) {
      const adjY = y + delta.y;
      const adjX = x + delta.x;
      const adjCell = grid[width * adjY + adjX];
      if (adjY >= width || adjX >= height || adjCell?.mineCount !== -1) {
        continue;
      }
      mineCount++;
    }

    if (mineCount > 0) {
      grid[i] = { ...cell, mineCount };
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

  grid[width * point.y + point.x] = {
    ...cell,
    status: cell.status === "hidden" ? "flagged" : "hidden",
  };
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
      grid[i] = {
        ...cell,
        status: "detonated",
      };
      continue;
    }
    if (cell.status !== "revealed") {
      grid[i] = {
        ...cell,
        status: "revealed",
      };
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
    for (const delta of POINT_DELTAS) {
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

  for (const index of adjIndexes) {
    const cell = grid[index];
    if (cell.status === "revealed") {
      continue;
    }
    grid[index] = { ...cell, status: "revealed" };
  }
}

/** Check if the given grid has been won */
function checkGridWin(grid: MutableGrid): boolean {
  let mineOrRevealedAmt = 0;
  for (const cell of grid) {
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
