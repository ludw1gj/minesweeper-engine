import {
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from 'https://deno.land/std@0.121.0/testing/asserts.ts'
import { createMinesweeperEngine } from './engine.ts'
import { Minesweeper } from './types.ts'
import { createCoordinate, createDifficultyLevel } from './util.ts'

/** Reveal coordinate (0, 2) to win. Flag coordinate (2, 2) to loose. */
const finalWaterCellGameState = (): Minesweeper => {
  const height = 3
  const width = 3
  const numMines = 3
  return {
    difficulty: createDifficultyLevel(height, width, numMines),
    grid: [
      [
        {
          status: 'revealed',
          mineCount: 0,
        },
        {
          status: 'revealed',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 1,
        },
      ],
      [
        {
          status: 'revealed',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 3,
        },
        {
          status: 'flagged',
          mineCount: -1,
        },
      ],
      // REVEAL THIS CELL
      [
        {
          status: 'hidden',
          mineCount: 1,
        },
        {
          status: 'flagged',
          mineCount: -1,
        },
        {
          status: 'hidden',
          mineCount: -1,
        },
      ],
    ],
    status: 'running',
    randSeed: 6,
    numFlagged: 2,
    numRemainingFlags: numMines - 2,
    numCells: height * width,
    numVisibleCells: 5,
  }
}

Deno.test('startGame - start correctly', () => {
  const engine = createMinesweeperEngine()
  engine.startGame(createDifficultyLevel(2, 2, 1), 6)

  const height = 2
  const width = 2
  const numMines = 1
  const desiredState: Minesweeper = {
    difficulty: createDifficultyLevel(height, width, numMines),
    numCells: height * width,
    grid: [
      [
        {
          status: 'hidden',
          mineCount: 0,
        },
        {
          status: 'hidden',
          mineCount: 0,
        },
      ],
      [
        {
          status: 'hidden',
          mineCount: 0,
        },
        {
          status: 'hidden',
          mineCount: 0,
        },
      ],
    ],
    numFlagged: 0,
    status: 'ready',
    numRemainingFlags: 1,
    randSeed: 6,
    numVisibleCells: 0,
  }

  assertEquals(engine.gameState.value, desiredState)
  assertEquals(engine.gameState.value.numRemainingFlags, 1)
  assertEquals(engine.gameState.value.numFlagged, 0)
})

Deno.test(
  'startGame - same mine cell coordinates if given same seed',
  () => {
    const engine1 = createMinesweeperEngine()
    const engine2 = createMinesweeperEngine()
    const engine3 = createMinesweeperEngine()
    const difficulty = createDifficultyLevel(3, 3, 3)
    const randSeed = 6
    engine1.startGame(difficulty, randSeed)
    engine2.startGame(difficulty, randSeed)
    engine3.startGame(difficulty, randSeed)

    assertEquals(engine1.gameState.value, engine2.gameState.value)
    assertEquals(engine1.gameState.value, engine3.gameState.value)
  },
)

Deno.test(
  'startGame - different mine cell coordinates if given different seeds',
  () => {
    const engine1 = createMinesweeperEngine()
    const engine2 = createMinesweeperEngine()
    const engine3 = createMinesweeperEngine()
    const difficulty = createDifficultyLevel(3, 3, 3)
    engine1.startGame(difficulty, 6)
    engine2.startGame(difficulty, 7)
    engine3.startGame(difficulty, 8)

    assertNotEquals(engine1.gameState.value, engine2.gameState.value)
    assertNotEquals(engine1.gameState.value, engine3.gameState.value)
  },
)

Deno.test('loadGame - successfully load previous game', () => {
  const engine = createMinesweeperEngine()
  const previousGame = finalWaterCellGameState()
  engine.loadGame(previousGame)
  assertEquals(engine.gameState.value, previousGame)
})

Deno.test('revealCell - do nothing if game is not running', () => {
  const engine = createMinesweeperEngine()
  const prevState = engine.gameState.value
  engine.revealCell(createCoordinate(2, 2))

  assertEquals(engine.gameState.value, prevState)
})

Deno.test('revealCell - reveal empty adjacent cells', () => {
  const height = 4
  const width = 4
  const numMines = 2
  const desiredState: Minesweeper = {
    difficulty: createDifficultyLevel(height, width, numMines),
    grid: [
      [
        {
          status: 'hidden',
          mineCount: 1,
        },
        {
          status: 'hidden',
          mineCount: -1,
        },
        {
          status: 'revealed',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 0,
        },
      ],
      [
        {
          status: 'hidden',
          mineCount: 2,
        },
        {
          status: 'hidden',
          mineCount: 2,
        },
        {
          status: 'revealed',
          mineCount: 2,
        },
        {
          status: 'revealed',
          mineCount: 0,
        },
      ],
      [
        {
          status: 'hidden',
          mineCount: 1,
        },
        {
          status: 'hidden',
          mineCount: -1,
        },
        {
          status: 'revealed',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 0,
        },
      ],
      [
        {
          status: 'hidden',
          mineCount: 1,
        },
        {
          status: 'hidden',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 1,
        },
        {
          status: 'revealed',
          mineCount: 0,
        },
      ],
    ],
    numFlagged: 0,
    status: 'running',
    numRemainingFlags: numMines,
    randSeed: 6,
    numCells: 16,
    numVisibleCells: 8,
  }
  const gameEngine = createMinesweeperEngine()
  gameEngine.startGame(createDifficultyLevel(height, width, numMines), 6)
  gameEngine.revealCell(createCoordinate(3, 0))
  assertEquals(gameEngine.gameState.value, desiredState)
})

Deno.test(
  'revealCell - no change to state if given coordinate of revealed cell',
  () => {
    const engine = createMinesweeperEngine()
    engine.startGame(createDifficultyLevel(3, 3, 3), 6)
    engine.revealCell(createCoordinate(0, 0))
    const firstMoveState = engine.gameState.value
    engine.revealCell(createCoordinate(0, 0))
    assertStrictEquals(engine.gameState.value, firstMoveState)
  },
)

Deno.test('revealCell - game is lost', () => {
  const engine = createMinesweeperEngine()
  const gameLoad = finalWaterCellGameState()
  engine.loadGame(gameLoad)
  engine.revealCell(createCoordinate(2, 2))

  assertEquals(engine.gameState.value.status, 'loss')
  assertEquals(engine.gameState.value.numRemainingFlags, 0)
  assertEquals(
    engine.gameState.value.numVisibleCells,
    engine.gameState.value.numCells,
  )
  assertEquals(engine.gameState.value.savedGridState, gameLoad.grid)
})

Deno.test('revealCell - flag count when revealing a flagged cell', () => {
  const engine = createMinesweeperEngine()
  engine.startGame(createDifficultyLevel(3, 3, 2), 6)
  engine.toggleFlag(createCoordinate(0, 0))
  assertEquals(engine.gameState.value.grid.at(0)?.at(0)?.status, 'flagged')
  assertEquals(engine.gameState.value.numRemainingFlags, 1)

  engine.revealCell(createCoordinate(0, 0))
  assertEquals(engine.gameState.value.grid.at(0)?.at(0)?.status, 'revealed')
  assertEquals(engine.gameState.value.numRemainingFlags, 2)
})

Deno.test('revealCell - game win', () => {
  const engine = createMinesweeperEngine()
  const gameLoad = finalWaterCellGameState()
  engine.loadGame(gameLoad)
  engine.revealCell(createCoordinate(0, 2))

  assertEquals(engine.gameState.value.status, 'win')
  assertEquals(engine.gameState.value.numRemainingFlags, 0)
  assertEquals(
    engine.gameState.value.numVisibleCells,
    engine.gameState.value.numCells,
  )
})

Deno.test('undoLoosingMove - undo lossing move', () => {
  const engine = createMinesweeperEngine()
  const gameLoad = finalWaterCellGameState()
  engine.loadGame(gameLoad)
  engine.revealCell(createCoordinate(2, 2))
  engine.undoLoosingMove()
  assertEquals(engine.gameState.value.status, 'running')
  assertEquals(engine.gameState.value.grid, gameLoad.grid)
})

Deno.test('toggleFlag - toggle flag', () => {
  const engine = createMinesweeperEngine()
  engine.startGame(createDifficultyLevel(3, 3, 2), 6)
  assertEquals(engine.gameState.value.grid.at(2)?.at(2)?.status, 'hidden')
  assertEquals(engine.gameState.value.numRemainingFlags, 2)

  engine.toggleFlag(createCoordinate(2, 2))
  assertEquals(engine.gameState.value.grid.at(2)?.at(2)?.status, 'flagged')
  assertEquals(engine.gameState.value.numRemainingFlags, 1)
})

Deno.test('toggleFlag - untoggle flag', () => {
  const engine = createMinesweeperEngine()
  engine.startGame(createDifficultyLevel(3, 3, 2), 6)
  engine.toggleFlag(createCoordinate(2, 2))
  assertEquals(engine.gameState.value.grid.at(2)?.at(2)?.status, 'flagged')

  engine.toggleFlag(createCoordinate(2, 2))
  assertEquals(engine.gameState.value.grid.at(2)?.at(2)?.status, 'hidden')
  assertEquals(engine.gameState.value.numRemainingFlags, 2)
})

Deno.test('toggleFlag - no change if toggling flag on revealed cell', () => {
  const engine = createMinesweeperEngine()

  engine.startGame(createDifficultyLevel(3, 3, 2), 6)
  engine.revealCell(createCoordinate(0, 0))
  assertEquals(engine.gameState.value.grid.at(0)?.at(0)?.status, 'revealed')

  engine.toggleFlag(createCoordinate(0, 0))
  assertEquals(engine.gameState.value.grid.at(0)?.at(0)?.status, 'revealed')
  assertEquals(engine.gameState.value.numRemainingFlags, 2)
})

Deno.test('toggleFlag - negative flag count', () => {
  const engine = createMinesweeperEngine()
  engine.startGame(createDifficultyLevel(3, 3, 2), 6)

  engine.toggleFlag(createCoordinate(2, 0))
  assertEquals(engine.gameState.value.numFlagged, 1)
  assertEquals(engine.gameState.value.numRemainingFlags, 1)

  engine.toggleFlag(createCoordinate(2, 1))
  assertEquals(engine.gameState.value.numFlagged, 2)
  assertEquals(engine.gameState.value.numRemainingFlags, 0)

  engine.toggleFlag(createCoordinate(2, 2))
  assertEquals(engine.gameState.value.numFlagged, 3)
  assertEquals(engine.gameState.value.numRemainingFlags, -1)

  engine.toggleFlag(createCoordinate(2, 2))
  assertEquals(engine.gameState.value.numFlagged, 2)
  assertEquals(engine.gameState.value.numRemainingFlags, 0)

  engine.toggleFlag(createCoordinate(2, 1))
  assertEquals(engine.gameState.value.numFlagged, 1)
  assertEquals(engine.gameState.value.numRemainingFlags, 1)

  engine.toggleFlag(createCoordinate(2, 0))
  assertEquals(engine.gameState.value.numFlagged, 0)
  assertEquals(engine.gameState.value.numRemainingFlags, 2)
})
