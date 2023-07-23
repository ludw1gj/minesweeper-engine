import { Cell, Coordinate, Grid, RandomNumberGenerator } from "./types.ts";

/** The change to a coordinate to adjacent cells. */
const neighbourCellDeltas: ReadonlyArray<Coordinate> = [-1, 0, 1]
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
  mines: number,
  randSeed: number,
  coordinate: Coordinate,
): Grid {
  const minedGrid = placeRandonMines(
    grid,
    mines,
    randSeed,
    coordinate,
  );
  const countedGrid = placeNeigbouringMinesCount(minedGrid);
  return revealCellInGrid(countedGrid, coordinate);
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlagInGrid(
  grid: Grid,
  coordinate: Coordinate,
): Grid {
  const cell = getCell(grid, coordinate);
  const canToggle = cell?.status === "hidden" ||
    cell?.status === "flagged";
  return canToggle
    ? updateCell(grid, coordinate, {
      ...cell,
      status: cell.status === "hidden" ? "flagged" : "hidden",
    })
    : grid;
}

/** Make cell revealed at the given coordinate. */
export function revealCellInGrid(
  grid: Grid,
  coordinate: Coordinate,
): Grid {
  const cell = getCell(grid, coordinate);
  if (!cell || cell.status === "revealed") {
    return grid;
  }

  const isLoss = cell.mineCount === -1;
  if (isLoss) {
    return updateEachCell(grid, (col, x, y) =>
      col.mineCount === -1
        ? {
          ...col,
          status: x === coordinate.x && y === coordinate.y
            ? "detonated"
            : "revealed",
        }
        : cell);
  }

  const coorsToReveal = cell.mineCount === 0
    ? findNeighborsToReveal(grid, coordinate)
    : undefined;
  const updatedGrid = coorsToReveal
    ? updateEachCell(
      grid,
      (cell, x, y) =>
        cell.status === "revealed"
          ? cell
          : coorsToReveal.find((c) => c.x === x && c.y === y)
          ? { ...cell, status: "revealed" }
          : cell,
    )
    : updateCell(grid, coordinate, { ...cell, status: "revealed" });
  const cells = updatedGrid.flat();
  const isGameWin = cells.length === cells
    .reduce(
      (n, c) => c.status === "revealed" || c.mineCount === -1 ? n + 1 : n,
      0,
    );
  return isGameWin
    ? updateEachCell(
      updatedGrid,
      (c) =>
        c.status !== "revealed"
          ? {
            ...c,
            status: "revealed",
          }
          : c,
    )
    : updatedGrid;
}

/**
 * Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function placeRandonMines(
  grid: Grid,
  numMines: number,
  randSeed: number,
  seedCoordinate: Coordinate,
): Grid {
  const mineCoordinates = generateRandomMineCoors(
    grid,
    numMines,
    randSeed,
    seedCoordinate,
  );
  return updateEachCell(
    grid,
    (cell, x, y) =>
      mineCoordinates.find((mineCoor) => mineCoor.x === x && mineCoor.y === y)
        ? { ...cell, mineCount: -1 }
        : cell,
  );
}

function placeNeigbouringMinesCount(grid: Grid): Grid {
  return updateEachCell(grid, (cell, x, y) =>
    cell.mineCount === -1 ? cell : {
      ...cell,
      mineCount: neighbourCellDeltas.reduce((total, delta) =>
        getCell(grid, { y: y + delta.y, x: x + delta.x })?.mineCount === -1
          ? total + 1
          : total, 0),
    });
}

function findCoordinateDistance(
  coordinateA: Coordinate,
  coordinateB: Coordinate,
): number {
  const distanceX = Math.abs(coordinateB.x - coordinateA.x);
  const distanceY = Math.abs(coordinateB.y - coordinateA.y);
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
  coordinate: Coordinate,
): Coordinate[] {
  const queue: Coordinate[] = [coordinate];
  const neighborCoorsToReveal: Coordinate[] = [];

  while (queue.length) {
    const coor = queue.shift()!;
    const cell = getCell(grid, coor);
    if (
      !cell ||
      neighborCoorsToReveal.find((c) => c.x === coor.x && c.y === coor.y)
    ) {
      continue;
    }

    neighborCoorsToReveal.push(coor);
    if (cell.mineCount !== 0) {
      continue;
    }

    for (const { x, y } of neighbourCellDeltas) {
      const neighbourCoor = {
        x: coor.x + x,
        y: coor.y + y,
      };
      const neighbourCell = getCell(grid, neighbourCoor);
      if (!neighbourCell) {
        continue;
      }
      queue.push(neighbourCoor);
    }
  }

  return neighborCoorsToReveal;
}

function generateRandomMineCoor(
  grid: Grid,
  seedCoordinate: Coordinate,
  randomNumberGenerator: RandomNumberGenerator,
): Coordinate {
  let coordinate: Coordinate | undefined;
  while (!coordinate) {
    const gridHeight = grid.length;
    const gridWidth = grid[0].length;
    const randCoor = {
      x: Math.floor(randomNumberGenerator() * gridWidth),
      y: Math.floor(randomNumberGenerator() * gridHeight),
    };
    const isSmallGrid = gridHeight < 4 && gridWidth < 4;
    const minDistance = isSmallGrid ? 1 : 2;
    const distance = findCoordinateDistance(seedCoordinate, randCoor);
    if (distance < minDistance) {
      continue;
    }
    coordinate = randCoor;
  }
  return coordinate;
}

function generateRandomMineCoors(
  grid: Grid,
  numMines: number,
  randSeed: number,
  seedCoordinate: Coordinate,
): Coordinate[] {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed);
  const randomCoordinates: Coordinate[] = [];
  while (randomCoordinates.length !== numMines) {
    const randCoor = generateRandomMineCoor(
      grid,
      seedCoordinate,
      randomNumberGenerator,
    );
    const exists = randomCoordinates.find((coor) =>
      coor.x === randCoor.x && coor.y === randCoor.y
    );
    if (exists) {
      continue;
    }
    randomCoordinates.push(randCoor);
  }
  return randomCoordinates;
}

function getCell(grid: Grid, { y, x }: Coordinate) {
  const row = grid[y];
  return row ? row[x] : undefined;
}

function updateCell(grid: Grid, { y, x }: Coordinate, cell: Cell) {
  return grid.with(y, grid[y].with(x, cell));
}

function updateEachCell(
  grid: Grid,
  fn: (cell: Cell, x: number, y: number) => Cell,
) {
  return grid.map((row, y) => row.map((cell, x) => fn(cell, x, y)));
}
