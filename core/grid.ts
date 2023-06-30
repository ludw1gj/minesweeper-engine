import {
  Cell,
  Coordinate,
  Difficulty,
  Grid,
  RandomNumberGenerator,
} from './types.ts'

/** The change to a coordinate to adjacent cells. */
const adjacentCellIndexDeltas: ReadonlyArray<Coordinate> = [-1, 0, 1]
  .flatMap((y) => [-1, 0, 1].map((x) => ({ x, y })))
  .filter(({ x, y }) => !(x === 0 && y === 0))

/**
 * Fill the grid with mine and water cells. A seed coordinate is needed as the first cell
 * clicked should be a water cell with a mine count of 0. Returns new minesweeper grid instance.
 */
export function fillGrid(
  grid: Grid,
  difficulty: Difficulty,
  firstCoordinate: Coordinate,
  randSeed: number,
): Grid {
  const mineCoordinates = generateRandonMineCoordinates(
    firstCoordinate,
    difficulty.height,
    difficulty.width,
    difficulty.numMines,
    randSeed,
  )

  const getMineCount = (coordinate: Coordinate) =>
    mineCoordinates.find((mineCoordinate) =>
      areCoordinatesEqual(coordinate, mineCoordinate)
    )

  const countAdjacentMines = (
    atCoordinate: Coordinate,
  ): number =>
    adjacentCellIndexDeltas.filter(({ x, y }) =>
      mineCoordinates.find((mineCoordinate) =>
        areCoordinatesEqual(mineCoordinate, {
          x: atCoordinate.x + x,
          y: atCoordinate.y + y,
        })
      )
    ).length

  const filledGrid = grid.map((row, y) =>
    row.map((cell, x) => ({
      ...cell,
      mineCount: getMineCount({ x, y }) ? -1 : countAdjacentMines({ x, y }),
    }))
  )
  return revealCellInGrid(filledGrid, firstCoordinate)
}

/** Update cell status to Revealed in grid. If cell has a mine count of 0, the adjacent hidden cells will be made revealed. */
export function revealCellInGrid(grid: Grid, atCoordinate: Coordinate): Grid {
  const cellToReveal = grid.at(atCoordinate.y)?.at(atCoordinate.x)
  const adjacentCellsToReveal = cellToReveal?.mineCount === 0
    ? findAdjacentHiddenWaterCells(grid, atCoordinate)
    : undefined
  return grid.map((row, y) =>
    row.map((cell, x) =>
      y === atCoordinate.y && x === atCoordinate.x ||
        adjacentCellsToReveal?.includes(cell)
        ? { ...cell, status: 'revealed' }
        : cell
    )
  )
}

/**
 * Generate coordinates to place mine cells on a grid. The seed coordinate must be a water cell
 * with an adjacent mines count of 0, and therefore must not be a mine cell.
 */
function generateRandonMineCoordinates(
  seedCoordinate: Coordinate,
  height: number,
  width: number,
  numMines: number,
  randSeed: number,
): Coordinate[] {
  const randomNumberGenerator = createRandomNumberGenerator(randSeed)

  const getRandomMineCoor = (): Coordinate => {
    const randCoor = {
      x: Math.floor(randomNumberGenerator() * width),
      y: Math.floor(randomNumberGenerator() * height),
    }
    const isSmallGrid = height < 4 && width < 4
    const minDistance = isSmallGrid ? 1 : 2
    const distance = findCoordinateDistance(seedCoordinate, randCoor)
    if (distance >= minDistance) {
      return randCoor
    }
    return getRandomMineCoor()
  }

  const getRandomMineCoors = (
    randomCoordinates: Coordinate[] = [],
  ): Coordinate[] => {
    if (randomCoordinates.length === numMines) {
      return randomCoordinates
    }
    const randCoor = getRandomMineCoor()
    const exists = randomCoordinates.find((coor) =>
      areCoordinatesEqual(coor, randCoor)
    )
    return getRandomMineCoors(
      exists ? randomCoordinates : [randCoor, ...randomCoordinates],
    )
  }

  return getRandomMineCoors()
}

/** Check if given coordinates are equal. */
function areCoordinatesEqual(
  coordinateA: Coordinate,
  coordinateB: Coordinate,
): boolean {
  return coordinateA.y === coordinateB.y && coordinateA.x === coordinateB.x
}

/** Find the distance (the amount of steps) between two coordinates. */
function findCoordinateDistance(
  coordinateA: Coordinate,
  coordinateB: Coordinate,
): number {
  const distanceX = Math.abs(coordinateB.x - coordinateA.x)
  const distanceY = Math.abs(coordinateB.y - coordinateA.y)
  const min = Math.min(distanceX, distanceY)
  const max = Math.max(distanceX, distanceY)
  const diagonalSteps = min
  const straightSteps = max - min
  return Math.sqrt(2) * diagonalSteps + straightSteps
}

/** Find adjacent cells of a 0 mine count cell at the given coordinate. */
function findAdjacentHiddenWaterCells(
  grid: Grid,
  coordinate: Coordinate,
  adjacentCells: Cell[] = [],
): Cell[] {
  for (const delta of adjacentCellIndexDeltas) {
    const adjacentX = coordinate.x + delta.x
    const adjacentY = coordinate.y + delta.y
    const adjacentCell = (grid[adjacentY] ?? [])[adjacentX]
    if (
      adjacentCell?.status !== 'hidden' ||
      adjacentCells.includes(adjacentCell)
    ) {
      continue
    }
    adjacentCells.push(adjacentCell)
    if (adjacentCell.mineCount !== 0) {
      continue
    }
    findAdjacentHiddenWaterCells(
      grid,
      { x: adjacentX, y: adjacentY },
      adjacentCells,
    )
  }
  return adjacentCells
}

/** Create a random number generator callback. */
function createRandomNumberGenerator(
  seed: number,
): RandomNumberGenerator {
  if (seed === 0) {
    console.warn('seed cannot be 0, defaulting to 1')
  }
  let seedDecendent = seed || 1
  return (max = 1, min = 0) => {
    seedDecendent = (seedDecendent * 9301 + 49297) % 233280
    const rnd = seedDecendent / 233280
    return min + rnd * (max - min)
  }
}
