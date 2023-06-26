import { signal, computed } from "@preact/signals";
import {
  Coordinate,
  Difficulty,
  Minesweeper,
  MinesweeperInternal,
} from "../core/types.ts";
import * as core from "../core/game.ts";
import { countCells } from "../core/grid.ts";

const initialState: MinesweeperInternal = {
  difficulty: { height: 0, width: 0, numMines: 0 },
  grid: [[]],
  randSeed: 1,
};

export const createMinesweeperEngine = () => {
  const state = signal<MinesweeperInternal>(initialState);

  const gameState = computed<Minesweeper>(() => {
    const { flagged, remainingFlags, visible, detonated, total } = countCells(
      state.value.grid
    );
    const status = core.getGameStatus(total, visible, detonated);
    return {
      ...state.value,
      numRemainingFlags:
        status === "win" || status === "loss" ? 0 : remainingFlags,
      numFlagged: flagged,
      numCells: total,
      numVisibleCells: visible,
      status,
    };
  });

  const startGame = (difficulty: Difficulty, randSeed: number) =>
    (state.value = core.startGame(difficulty, randSeed));
  const loadGame = (previousLoad: MinesweeperInternal) =>
    (state.value = previousLoad);
  const revealCell = (coordinate: Coordinate) =>
    (state.value = core.revealCell(
      state.value,
      coordinate,
      gameState.value.status
    ));
  const toggleFlag = (coordinate: Coordinate) =>
    (state.value = core.toggleFlag(state.value, coordinate));
  const undoLoosingMove = () => (state.value = core.undoMove(state.value));

  return {
    gameState,
    startGame,
    loadGame,
    revealCell,
    toggleFlag,
    undoLoosingMove,
  };
};
