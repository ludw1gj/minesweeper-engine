import { Signal } from "@preact/signals";
import {
  countMines,
  deployMines,
  generateInitialGrid,
  revealPoint,
  toggleFlagPoint,
} from "./grid.ts";
import {
  Difficulty,
  GameStatus,
  Grid,
  MinesweeperState,
  Point,
} from "./types.ts";

/** Create a minesweeper game. Mines are not generated until first move. */
export function startGame(
  game: Signal<MinesweeperState>,
  difficulty: Difficulty,
  randSeed: number,
) {
  game.value = {
    ...game.value,
    board: generateInitialGrid(
      difficulty.height,
      difficulty.width,
    ),
    difficulty,
    randSeed,
  };
}

/** Reveal cell revealed at the given point. */
export function revealCell(
  game: Signal<MinesweeperState>,
  status: GameStatus,
  point: Point,
) {
  const isFirstMove = status === "ready";
  const isPlayableStatus = isFirstMove || status === "running";
  const { board, difficulty, randSeed } = game.value;
  const cell = board[difficulty.width * point.y + point.x];
  if (!cell || cell.status === "revealed" || !isPlayableStatus) {
    return;
  }

  const isLoss = cell.mines === -1;
  const currBoard = [...board];
  if (isFirstMove) {
    deployMines(
      currBoard,
      difficulty.width,
      point,
      difficulty.mines,
      randSeed,
    );
  }
  revealPoint(currBoard, difficulty.width, point);
  game.value = {
    ...game.value,
    savedBoard: isLoss ? game.value.board : undefined,
    board: currBoard,
  };
}

/** Toggle the flag value of cell at the given point. */
export function toggleFlag(
  game: Signal<MinesweeperState>,
  point: Point,
) {
  const currBoard = [...game.value.board];
  toggleFlagPoint(
    currBoard,
    game.value.difficulty.width,
    point,
  );
  game.value = {
    ...game.value,
    board: currBoard,
  };
}

/** Load the previous board state. */
export function undoLoosingMove(game: Signal<MinesweeperState>) {
  if (!game.value.savedBoard) {
    return;
  }
  game.value = { ...game.value, board: game.value.savedBoard };
}

export const loadGame = (
  game: Signal<MinesweeperState>,
  grid: Grid,
  width: number,
  randSeed: number,
) => {
  game.value = {
    ...game.value,
    board: grid,
    difficulty: {
      height: Math.floor(grid.length / width),
      width,
      mines: countMines(grid),
    },
    randSeed,
  };
};

export function reset(game: Signal<MinesweeperState>) {
  game.value = {
    board: [],
    difficulty: {
      height: 0,
      width: 0,
      mines: 0,
    },
    randSeed: 1,
    savedBoard: undefined,
  };
}
