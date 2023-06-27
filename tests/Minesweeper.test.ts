import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from 'https://deno.land/std@0.121.0/testing/asserts.ts'
import {
  beforeEach,
  describe,
  it,
} from 'https://deno.land/std@0.192.0/testing/bdd.ts'
import {
  createCoordinate,
  createDifficultyLevel,
  createMinesweeperEngine,
  Minesweeper,
} from '../src/index.ts'

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

describe('create a game', () => {
  it('do nothing if game is not running', () => {
    const engine = createMinesweeperEngine()
    const prevState = engine.gameState.value
    engine.revealCell(createCoordinate(2, 2))

    assertEquals(engine.gameState.value, prevState)
  })

  it('should start correctly', () => {
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
      numRemainingFlags: 0,
      randSeed: 6,
      numVisibleCells: 0,
    }

    assertEquals(engine.gameState.value, desiredState)
  })

  it('should have same mine cell coordinates if given same seed', () => {
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
  })

  it('should have different mine cell coordinates if given different seeds', () => {
    const engine1 = createMinesweeperEngine()
    const engine2 = createMinesweeperEngine()
    const engine3 = createMinesweeperEngine()
    const difficulty = createDifficultyLevel(3, 3, 3)
    engine1.startGame(difficulty, 6)
    engine2.startGame(difficulty, 7)
    engine3.startGame(difficulty, 8)

    assertNotEquals(engine1.gameState.value, engine2.gameState.value)
    assertNotEquals(engine1.gameState.value, engine3.gameState.value)
  })

  it('should successfully load from given game state', () => {
    const engine = createMinesweeperEngine()
    const previousGame = finalWaterCellGameState()
    engine.loadGame(previousGame)
    assertEquals(engine.gameState.value, previousGame)
  })
})

describe('reveal cell', () => {
  const predefinedEngine = () => {
    const engine = createMinesweeperEngine()
    engine.startGame(createDifficultyLevel(3, 3, 3), 6)
    engine.revealCell(createCoordinate(0, 0))
    return engine
  }

  it('should reveal cell and empty adjacent cells', () => {
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

  it('new grid object created', () => {
    const engine = predefinedEngine()
    const initialState = engine.gameState.value
    engine.revealCell(createCoordinate(0, 1))

    assert(engine.gameState.value.grid !== initialState.grid)
  })

  it('no change to state if given coordinate of revealed cell', () => {
    const engine = predefinedEngine()
    engine.revealCell(createCoordinate(0, 0))
    const firstMoveState = engine.gameState.value
    engine.revealCell(createCoordinate(0, 0))
    assertStrictEquals(engine.gameState.value, firstMoveState)
  })
})

describe('game is won', () => {
  const predefinedEngineWon = () => {
    const engine = createMinesweeperEngine()
    const gameLoad = finalWaterCellGameState()
    engine.loadGame(gameLoad)
    engine.revealCell(createCoordinate(0, 2))
    return engine
  }
  let engine: ReturnType<typeof predefinedEngineWon>

  beforeEach(() => {
    engine = predefinedEngineWon()
  })

  it('when all water cells are revealed', () => {
    assertEquals(engine.gameState.value.status, 'win')
  })

  it('status should be "Won"', () => {
    assertEquals(engine.gameState.value.status, 'win')
  })

  it('remaining flags should be 0', () => {
    assertEquals(engine.gameState.value.numRemainingFlags, 0)
  })

  it('all cells should be revealed', () => {
    assertEquals(
      engine.gameState.value.numVisibleCells,
      engine.gameState.value.numCells,
    )
  })
})

describe('game is lost', () => {
  const predefinedEngineLoss = () => {
    const engine = createMinesweeperEngine()
    const gameLoad = finalWaterCellGameState()
    engine.loadGame(gameLoad)
    engine.revealCell(createCoordinate(2, 2))
    return engine
  }
  let engine: ReturnType<typeof predefinedEngineLoss>
  const gameLoad = finalWaterCellGameState()

  beforeEach(() => {
    engine = predefinedEngineLoss()
  })

  it('status should be "Loss"', () => {
    assertEquals(engine.gameState.value.status, 'loss')
  })

  it('remaining flags should be 0', () => {
    assertEquals(engine.gameState.value.numRemainingFlags, 0)
  })

  it('all cells should be revealed', () => {
    assertEquals(
      engine.gameState.value.numVisibleCells,
      engine.gameState.value.numCells,
    )
  })

  it('should save grid state on loss', () => {
    assertEquals(engine.gameState.value.savedGridState, gameLoad.grid)
  })

  it('can undo lossing move', () => {
    assertEquals(engine.gameState.value.status, 'loss')
    engine.undoLoosingMove()
    assertEquals(engine.gameState.value.grid, gameLoad.grid)
  })
})

describe('toggle flag', () => {
  const predefinedEngine = () => {
    const engine = createMinesweeperEngine()
    engine.startGame(createDifficultyLevel(3, 3, 2), 6)
    engine.revealCell(createCoordinate(0, 0))
    return engine
  }
  let engine: ReturnType<typeof predefinedEngine>

  beforeEach(() => {
    engine = predefinedEngine()
  })

  it('correct initial remaining flag', () => {
    assertEquals(engine.gameState.value.numRemainingFlags, 2)
  })

  it('cell should be toggled correctly', () => {
    engine.toggleFlag(createCoordinate(2, 2))
    assertEquals(engine.gameState.value.grid[2][2].status, 'flagged')

    engine.toggleFlag(createCoordinate(2, 2))
    assertEquals(engine.gameState.value.grid[2][2].status, 'hidden')
  })

  it('update flag count correctly', () => {
    assertEquals(engine.gameState.value.numFlagged, 0)
    assertEquals(engine.gameState.value.numRemainingFlags, 2)

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
  })

  it('remaining flag count should be correct when revealing a flagged cell', () => {
    engine.toggleFlag(createCoordinate(2, 2))
    assertEquals(engine.gameState.value.grid[2][2].status, 'flagged')
    assertEquals(engine.gameState.value.numRemainingFlags, 1)

    engine.revealCell(createCoordinate(2, 2))
    assertEquals(engine.gameState.value.grid[2][2].status, 'revealed')
    assertEquals(engine.gameState.value.numRemainingFlags, 2)
  })

  it('no change if toggling flag on revealed cell', () => {
    assertEquals(engine.gameState.value.grid[0][0].status, 'revealed')
    engine.toggleFlag(createCoordinate(0, 0))
    assertEquals(engine.gameState.value.grid[0][0].status, 'revealed')
  })
})
