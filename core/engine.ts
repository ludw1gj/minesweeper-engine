import { computed, signal } from '@preact/signals'
import {
  Coordinate,
  Difficulty,
  Minesweeper,
  MinesweeperInternal,
} from './types.ts'
import * as core from './actions.ts'

export function createMinesweeperEngine() {
  const state = signal<MinesweeperInternal>({
    difficulty: { height: 0, width: 0, numMines: 0 },
    grid: [[]],
    randSeed: 1,
  })
  const gameState = computed<Minesweeper>(() => core.getGameState(state.value))

  const startGame = (
    difficulty: Difficulty,
    randSeed: number,
  ): void => {
    state.value = core.startGame(difficulty, randSeed)
  }

  const loadGame = (
    previousLoad: MinesweeperInternal,
  ): void => {
    state.value = previousLoad
  }

  const revealCell = (coordinate: Coordinate): void => {
    state.value = core.revealCell(
      state.value,
      coordinate,
      gameState.value.status,
    )
  }

  const toggleFlag = (
    coordinate: Coordinate,
  ): void => {
    state.value = core.toggleFlag(state.value, coordinate)
  }

  const undoLoosingMove = (): void => {
    state.value = core.undoMove(state.value)
  }

  return {
    gameState,
    startGame,
    loadGame,
    revealCell,
    toggleFlag,
    undoLoosingMove,
  }
}
