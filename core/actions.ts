import { fillGrid, revealCellInGrid } from './grid.ts'
import {
  Coordinate,
  Difficulty,
  GameStatus,
  Minesweeper,
  MinesweeperInternal,
} from './types.ts'

/** Create a minesweeper game. Game board isn't generated until first move */
export function startGame(
  difficulty: Difficulty,
  randSeed: number,
): MinesweeperInternal {
  return {
    difficulty,
    randSeed,
    grid: Array(difficulty.height)
      .fill(Array(difficulty.width).fill(undefined))
      .map((row) =>
        row.map(() => ({
          status: 'hidden',
          mineCount: 0,
        }))
      ),
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
      grid: fillGrid(game.grid, game.difficulty, coordinate, game.randSeed),
    }
  }

  const cell = game.grid.at(coordinate.y)?.at(coordinate.x)
  if (status !== 'running' || !cell || cell.status === 'revealed') {
    return game
  }

  const gameLoss = cell.mineCount === -1
  if (gameLoss) {
    return {
      ...game,
      grid: game.grid.map((row, y) =>
        row.map((cell, x) =>
          y === coordinate.y && x === coordinate.x
            ? { ...cell, status: 'detonated' }
            : cell.status === 'revealed'
            ? cell
            : { ...cell, status: 'revealed' }
        )
      ),
      savedGridState: game.grid,
    }
  }

  const grid = revealCellInGrid(game.grid, coordinate)
  const numTotalRevealableCells =
    game.difficulty.width * game.difficulty.height -
    game.difficulty.numMines
  const numRevealedCells = grid
    .flatMap((row) => row)
    .reduce(
      (n, cell) => cell.status === 'revealed' ? n + 1 : n,
      0,
    )
  const gameWin = numTotalRevealableCells === numRevealedCells
  return {
    ...game,
    grid: gameWin
      ? grid.map((row) =>
        row.map((cell) =>
          cell.status === 'revealed' ? cell : { ...cell, status: 'revealed' }
        )
      )
      : grid,
  }
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(
  game: MinesweeperInternal,
  coordinate: Coordinate,
): MinesweeperInternal {
  const cell = game.grid.at(coordinate.y)?.at(coordinate.x)
  const isFlaggable = cell?.status === 'hidden' ||
    cell?.status === 'flagged'
  if (isFlaggable) {
    return {
      ...game,
      grid: game.grid.map((row, y) =>
        row.map((cell, x) =>
          y === coordinate.y && x === coordinate.x
            ? {
              ...cell,
              status: cell.status === 'flagged' ? 'hidden' : 'flagged',
            }
            : cell
        )
      ),
    }
  }
  return game
}

/** Load the previous state. */
export function undoMove(game: MinesweeperInternal): MinesweeperInternal {
  return game.savedGridState
    ? {
      ...game,
      grid: game.savedGridState.map((row) => row.map((cell) => cell)),
    }
    : game
}

export function getGameState(game: MinesweeperInternal): Minesweeper {
  const { flagged, visible, detonated, total } = game.grid
    .flatMap((row) => row)
    .reduce(
      (count, cell) => ({
        visible: cell.status === 'revealed' || cell.status === 'detonated'
          ? count.visible + 1
          : count.visible,
        flagged: cell.status === 'flagged' ? count.flagged + 1 : count.flagged,
        detonated: cell.status === 'detonated'
          ? count.detonated + 1
          : count.detonated,
        total: count.total + 1,
      }),
      { visible: 0, flagged: 0, detonated: 0, total: 0 },
    )
  const status = ((): GameStatus => {
    if (total === 0) {
      return 'waiting'
    }
    if (visible === 0) {
      return 'ready'
    }
    if (detonated > 0) {
      return 'loss'
    }
    if (total === visible) {
      return 'win'
    }
    return 'running'
  })()

  return {
    ...game,
    status,
    numCells: total,
    numVisibleCells: visible,
    numFlagged: flagged,
    numRemainingFlags: status === 'win' || status === 'loss'
      ? 0
      : game.difficulty.numMines - flagged,
  }
}
