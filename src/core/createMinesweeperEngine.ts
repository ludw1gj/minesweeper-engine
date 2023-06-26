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
  status: "waiting",
  randSeed: 1,
};

export const createMinesweeperEngine = () => {
  const state = signal<MinesweeperInternal>(initialState);

  const startGame = (difficulty: Difficulty, randSeed: number) =>
    (state.value = core.startGame(difficulty, randSeed));
  const loadGame = (previousLoad: MinesweeperInternal) =>
    (state.value = previousLoad);
  const revealCell = (coordinate: Coordinate) =>
    (state.value = core.revealCell(state.value, coordinate));
  const toggleFlag = (coordinate: Coordinate) =>
    (state.value = core.toggleFlag(state.value, coordinate));
  const undoLoosingMove = () =>
    (state.value = core.undoLoosingMove(state.value));

  const gameState = computed<Minesweeper>(() => {
    const { numFlagged, remainingFlags, numVisible, numTotal } = countCells(
      state.value.grid
    );
    return {
      ...state.value,
      numRemainingFlags:
        state.value.status === "win" || state.value.status === "loss"
          ? 0
          : remainingFlags,
      numFlagged,
      numCells: numTotal,
      numVisibleCells: numVisible,
    };
  });

  return {
    gameState,
    startGame,
    loadGame,
    revealCell,
    toggleFlag,
    undoLoosingMove,
  };
};
