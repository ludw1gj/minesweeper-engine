import { Signal } from "@preact/signals";
import {
  buildBoard,
  createEmptyBoard,
  revealCellInGrid,
  toggleFlagInGrid,
} from "./grid.ts";
import {
  Difficulty,
  GameStatus,
  Grid,
  MinesweeperState,
  Point,
} from "./types.ts";

/** Create a minesweeper game. Game board isn't generated until first move */
export function startGame(
  game: Signal<MinesweeperState>,
  difficulty: Difficulty,
  randSeed: number,
) {
  game.value = {
    ...game.value,
    board: createEmptyBoard(
      difficulty.height,
      difficulty.width,
    ),
    difficulty,
    randSeed,
  };
}

/** Make cell revealed at the given coordinate. */
export function revealCell(
  game: Signal<MinesweeperState>,
  status: GameStatus,
  point: Point,
) {
  const isFirstMove = status === "ready";
  const isPlayableStatus = isFirstMove || status === "running";
  const row = game.value.board[point.y];
  const cell = row ? row[point.x] : undefined;
  if (!cell || cell.status === "revealed" || !isPlayableStatus) {
    return;
  }
  const isLoss = cell.mineCount === -1;
  const board = isFirstMove
    ? buildBoard(
      game.value.board,
      game.value.difficulty.mines,
      game.value.randSeed,
      point,
    )
    : game.value.board;
  game.value = {
    ...game.value,
    savedBoard: isLoss ? game.value.board : undefined,
    board: revealCellInGrid(board, point),
  };
}

/** Toggle the flag value of cell at the given coordinate. */
export function toggleFlag(
  game: Signal<MinesweeperState>,
  coordinate: Point,
) {
  game.value = {
    ...game.value,
    board: toggleFlagInGrid(game.value.board, coordinate),
  };
}

/** Load the previous state. */
export function undoLoosingMove(game: Signal<MinesweeperState>) {
  if (!game.value.savedBoard) {
    return;
  }
  game.value = { ...game.value, board: game.value.savedBoard };
}

export const loadGame = (
  game: Signal<MinesweeperState>,
  grid: Grid,
  randSeed: number,
) => {
  game.value = {
    ...game.value,
    board: grid,
    difficulty: {
      height: grid.length,
      width: grid[0].length,
      mines: grid.flat().reduce(
        (total, cell) => cell.mineCount === -1 ? total + 1 : total,
        0,
      ),
    },
    randSeed,
  };
};

export function reset(game: Signal<MinesweeperState>) {
  game.value = {
    board: [[]],
    difficulty: {
      height: 0,
      width: 0,
      mines: 0,
    },
    randSeed: 1,
    savedBoard: undefined,
  };
}
