import { Cell, Grid, Point, RandomNumberGenerator } from "./types.ts";

/** The change to a coordinate to adjacent cells. */
const neighbourCellDeltas: ReadonlyArray<Point> = [-1, 0, 1]
  .flatMap((y) => [-1, 0, 1].map((x) => ({ x, y })))
  .filter(({ x, y }) => !(x === 0 && y === 0));

export function createEmptyBoard(rows: number, cols: number): Grid {
  const cell: Cell = {
    status: "hidden",
    mineCount: 0,
  };
  const row = Array.from({ length: cols }, () => cell);
  return Array.from(
    { length: rows },
    () => row,
  );
}

export function buildBoard(
  grid: Grid,
  mineNum: number,
  randSeed: number,
  seedPoint: Point,
): Grid {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed);

  const minePoints: Point[] = [];
  while (minePoints.length !== mineNum) {
    let minePoint: Point | undefined;
    while (!minePoint) {
      const gridHeight = grid.length;
      const gridWidth = grid[0].length;
      const randPoint = {
        x: Math.floor(randomNumberGenerator() * gridWidth),
        y: Math.floor(randomNumberGenerator() * gridHeight),
      };
      const isSmallGrid = gridHeight < 4 && gridWidth < 4;
      const minDistance = isSmallGrid ? 1 : 2;
      const distance = findPointDistance(seedPoint, randPoint);
      if (distance < minDistance) {
        continue;
      }
      minePoint = randPoint;
    }

    const unique = minePoints.findIndex((p) =>
      p.x === minePoint?.x && p.y === minePoint.y
    ) === -1;
    if (unique) {
      minePoints.push(minePoint);
    }
  }

  let minedGrid = grid;
  const mine: Cell = {
    status: "hidden",
    mineCount: -1,
  };
  for (const point of minePoints) {
    minedGrid = minedGrid.with(point.y, grid[point.y].with(point.x, mine));
  }

  return minedGrid.map((row, y) =>
    row.map((cell, x) =>
      cell.mineCount !== -1
        ? {
          ...cell,
          mineCount: neighbourCellDeltas.reduce((total, delta) => {
            const row = minedGrid[y + delta.y];
            return row && row[x + delta.x]?.mineCount === -1
              ? total + 1
              : total;
          }, 0),
        }
        : cell
    )
  );
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlagInGrid(
  grid: Grid,
  point: Point,
): Grid {
  const cell = grid[point.y][point.x];
  const canToggle = cell?.status === "hidden" ||
    cell?.status === "flagged";
  return canToggle
    ? grid.with(
      point.y,
      grid[point.y].with(point.x, {
        ...cell,
        status: cell.status === "hidden" ? "flagged" : "hidden",
      }),
    )
    : grid;
}

/** Make cell revealed at the given coordinate. */
export function revealCellInGrid(
  grid: Grid,
  point: Point,
): Grid {
  const cell = grid[point.y] ? grid[point.y][point.x] : undefined;
  if (!cell || cell.status === "revealed") {
    return grid;
  }

  const isLoss = cell.mineCount === -1;
  if (isLoss) {
    return grid.map((row, y) =>
      row.map((cell, x) =>
        cell.mineCount === -1
          ? {
            ...cell,
            status: x === point.x && y === point.y ? "detonated" : "revealed",
          }
          : cell
      )
    );
  }

  const pointsToReveal = cell.mineCount === 0
    ? findNeighborsToReveal(grid, point)
    : undefined;
  const updatedGrid = pointsToReveal
    ? grid.map((row, y) =>
      row.map((cell, x) =>
        cell.status === "revealed"
          ? cell
          : pointsToReveal.find((c) => c.x === x && c.y === y)
          ? { ...cell, status: "revealed" } as Cell
          : cell
      )
    )
    : grid.with(
      point.y,
      grid[point.y].with(point.x, { ...cell, status: "revealed" } as Cell),
    );
  const cells = updatedGrid.flat();
  const isGameWin = cells.length === cells
    .reduce(
      (n, c) => c.status === "revealed" || c.mineCount === -1 ? n + 1 : n,
      0,
    );
  return isGameWin
    ? updatedGrid.map((row) =>
      row.map((c) =>
        c.status !== "revealed"
          ? {
            ...c,
            status: "revealed",
          }
          : c
      )
    )
    : updatedGrid;
}

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

/** Inclusive of given coordinate */
function findNeighborsToReveal(
  grid: Grid,
  point: Point,
): Point[] {
  const queue: Point[] = [point];
  const points: Point[] = [];

  while (queue.length) {
    const currPoint = queue.shift()!;
    const cell = grid[currPoint.y] ? grid[currPoint.y][currPoint.x] : undefined;
    if (
      !cell ||
      points.find((c) => c.x === currPoint.x && c.y === currPoint.y)
    ) {
      continue;
    }

    points.push(currPoint);
    if (cell.mineCount !== 0) {
      continue;
    }

    for (const delta of neighbourCellDeltas) {
      const adjPoint = {
        x: currPoint.x + delta.x,
        y: currPoint.y + delta.y,
      };
      const adjCell = grid[adjPoint.y]
        ? grid[adjPoint.y][adjPoint.x]
        : undefined;
      if (adjCell) {
        queue.push(adjPoint);
      }
    }
  }

  return points;
}
