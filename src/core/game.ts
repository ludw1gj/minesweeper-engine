import {
  createInitialGrid,
  initiateGrid,
  isWinGrid,
  revealAllCells,
  revealCellInGrid,
  setLoseState,
  toggleFlagInGrid,
} from './grid.ts'
import {
  Coordinate,
  Difficulty,
  GameStatus,
  MinesweeperInternal,
} from './types.ts'

export const getGameStatus = (
  cellsTotal: number,
  cellsVisible: number,
  cellsDetonated: number,
): GameStatus => {
  if (cellsTotal === 0) {
    return 'waiting'
  }
  if (cellsVisible === 0) {
    return 'ready'
  }
  if (cellsDetonated > 0) {
    return 'loss'
  }
  if (cellsTotal === cellsVisible) {
    return 'win'
  }
  return 'running'
}

/** Create a minesweeper game. Game board isn't generated until first move */
export function startGame(
  difficulty: Difficulty,
  randSeed: number,
): MinesweeperInternal {
  return {
    difficulty,
    grid: createInitialGrid(difficulty.height, difficulty.width),
    randSeed,
  }
}

/** Make cell revealed at the given coordinate. */
export function revealCell(
  game: MinesweeperInternal,
  coordinate: Coordinate,
  status: GameStatus,
): MinesweeperInternal {
  const firstMove = status === 'ready'
  if (firstMove) {
    return {
      ...game,
      grid: initiateGrid(game.grid, game.difficulty, coordinate, game.randSeed),
    }
  }
  if (status !== 'running') {
    return game
  }

  const cell = game.grid[coordinate.y][coordinate.x]
  if (cell.status === 'revealed') {
    return game
  }

  if (cell.mineCount === -1) {
    return {
      ...game,
      grid: setLoseState(game.grid, coordinate),
      savedGridState: game.grid,
    }
  }

  const grid = revealCellInGrid(game.grid, coordinate)
  if (isWinGrid(grid)) {
    return {
      ...game,
      grid: revealAllCells(game.grid),
    }
  }
  return { ...game, grid }
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(
  game: MinesweeperInternal,
  coordinate: Coordinate,
): MinesweeperInternal {
  const cell = game.grid[coordinate.y][coordinate.x]
  if (cell.status === 'revealed') {
    return game
  }
  return {
    ...game,
    grid: toggleFlagInGrid(game.grid, coordinate),
  }
}

/** Load the previous state. */
export function undoMove(game: MinesweeperInternal): MinesweeperInternal {
  if (!game.savedGridState) {
    return game
  }
  return {
    ...game,
    grid: game.savedGridState.map((row) => row.map((cell) => cell)),
  }
}
