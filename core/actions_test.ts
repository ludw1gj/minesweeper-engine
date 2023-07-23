import {
  assertEquals,
  assertNotEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.121.0/testing/asserts.ts";
import { createMinsweeperState } from "./state.ts";
import { Minesweeper } from "./types.ts";
import { createDifficultyLevel, createPoint } from "./util.ts";
import {
  loadGame,
  revealCell,
  startGame,
  toggleFlag,
  undoLoosingMove,
} from "./actions.ts";

/** Reveal coordinate (0, 2) to win. Flag coordinate (2, 2) to loose. */
const finalWaterCellGameState = (): Minesweeper => {
  const height = 3;
  const width = 3;
  const numMines = 3;
  return {
    difficulty: createDifficultyLevel(height, width, numMines),
    board: [
      [
        {
          status: "revealed",
          mineCount: 0,
        },
        {
          status: "revealed",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 1,
        },
      ],
      [
        {
          status: "revealed",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 3,
        },
        {
          status: "flagged",
          mineCount: -1,
        },
      ],
      // REVEAL THIS CELL
      [
        {
          status: "hidden",
          mineCount: 1,
        },
        {
          status: "flagged",
          mineCount: -1,
        },
        {
          status: "hidden",
          mineCount: -1,
        },
      ],
    ],
    status: "running",
    randSeed: 6,
    remainingFlags: 1,
    cellCounts: {
      revealed: 5,
      flagged: 2,
      detonated: 0,
      total: height * width,
    },
    savedBoard: undefined,
  };
};

Deno.test("startGame - start correctly", () => {
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(2, 2, 1), 6);

  const height = 2;
  const width = 2;
  const numMines = 1;
  const desiredState: Minesweeper = {
    difficulty: createDifficultyLevel(height, width, numMines),
    cellCounts: {
      revealed: 0,
      flagged: 0,
      detonated: 0,
      total: height * width,
    },
    board: [
      [
        {
          status: "hidden",
          mineCount: 0,
        },
        {
          status: "hidden",
          mineCount: 0,
        },
      ],
      [
        {
          status: "hidden",
          mineCount: 0,
        },
        {
          status: "hidden",
          mineCount: 0,
        },
      ],
    ],
    status: "ready",
    randSeed: 6,
    remainingFlags: 1,
    savedBoard: undefined,
  };

  assertEquals(game.peek(), desiredState);
});

Deno.test(
  "startGame - same mine cell coordinates if given same seed",
  () => {
    const { state: state1 } = createMinsweeperState();
    const { state: state2 } = createMinsweeperState();
    const { state: state3 } = createMinsweeperState();
    const difficulty = createDifficultyLevel(3, 3, 3);
    const randSeed = 6;
    startGame(state1, difficulty, randSeed);
    startGame(state2, difficulty, randSeed);
    startGame(state3, difficulty, randSeed);

    assertEquals(state1.value, state2.value);
    assertEquals(state1.value, state3.value);
  },
);

Deno.test(
  "startGame - different mine cell coordinates if given different seeds",
  () => {
    const { state } = createMinsweeperState();
    const difficulty = createDifficultyLevel(3, 3, 3);
    startGame(state, difficulty, 6);
    const gameState1 = state.value;
    startGame(state, difficulty, 7);
    const gameState2 = state.value;
    startGame(state, difficulty, 8);
    const gameState3 = state.value;

    assertNotEquals(gameState1, gameState2);
    assertNotEquals(gameState1, gameState3);
  },
);

Deno.test("loadGame - successfully load previous game", () => {
  const { state, game } = createMinsweeperState();
  const previousGame = finalWaterCellGameState();
  loadGame(state, previousGame.board, previousGame.randSeed);
  assertEquals(game.value, previousGame);
});

Deno.test("revealCell - do nothing if game is not running", () => {
  const { state, game } = createMinsweeperState();
  const prevState = state.value;
  revealCell(state, game.value.status, createPoint(2, 2));

  assertEquals(state.value, prevState);
});

Deno.test("revealCell - reveal empty adjacent cells", () => {
  const height = 4;
  const width = 4;
  const numMines = 2;
  const desiredState: Minesweeper = {
    difficulty: createDifficultyLevel(height, width, numMines),
    board: [
      [
        {
          status: "hidden",
          mineCount: 1,
        },
        {
          status: "hidden",
          mineCount: -1,
        },
        {
          status: "revealed",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 0,
        },
      ],
      [
        {
          status: "hidden",
          mineCount: 2,
        },
        {
          status: "hidden",
          mineCount: 2,
        },
        {
          status: "revealed",
          mineCount: 2,
        },
        {
          status: "revealed",
          mineCount: 0,
        },
      ],
      [
        {
          status: "hidden",
          mineCount: 1,
        },
        {
          status: "hidden",
          mineCount: -1,
        },
        {
          status: "revealed",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 0,
        },
      ],
      [
        {
          status: "hidden",
          mineCount: 1,
        },
        {
          status: "hidden",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 1,
        },
        {
          status: "revealed",
          mineCount: 0,
        },
      ],
    ],
    cellCounts: {
      revealed: 8,
      flagged: 0,
      detonated: 0,
      total: 16,
    },
    status: "running",
    remainingFlags: numMines,
    randSeed: 6,
    savedBoard: undefined,
  };
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(height, width, numMines), 6);

  revealCell(state, game.value.status, createPoint(3, 0));
  assertEquals(game.value, desiredState);
});

Deno.test(
  "revealCell - no change to state if given coordinate of revealed cell",
  () => {
    const { state, game } = createMinsweeperState();
    startGame(state, createDifficultyLevel(3, 3, 3), 6);
    revealCell(state, game.value.status, createPoint(0, 0));
    const firstMoveState = state.value;
    revealCell(state, game.value.status, createPoint(0, 0));
    assertStrictEquals(state.value, firstMoveState);
  },
);

Deno.test("revealCell - game is lost", () => {
  const { state, game } = createMinsweeperState();
  const gameLoad = finalWaterCellGameState();
  loadGame(state, gameLoad.board, gameLoad.randSeed);
  assertEquals(game.value.board[2][2].mineCount, -1);
  revealCell(state, game.value.status, createPoint(2, 2));

  assertEquals(game.value.status, "loss");
  assertEquals(game.value.remainingFlags, 0);
  assertEquals(game.value.savedBoard, gameLoad.board);
});

Deno.test("revealCell - flag count when revealing a flagged cell", () => {
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(3, 3, 2), 6);
  toggleFlag(state, createPoint(0, 0));
  assertEquals(game.value.board.at(0)?.at(0)?.status, "flagged");
  assertEquals(game.value.remainingFlags, 1);

  revealCell(state, game.value.status, createPoint(0, 0));
  assertEquals(game.value.board.at(0)?.at(0)?.status, "revealed");
  assertEquals(game.value.remainingFlags, 2);
});

Deno.test("revealCell - game win", () => {
  const { state, game } = createMinsweeperState();
  const gameLoad = finalWaterCellGameState();
  loadGame(state, gameLoad.board, gameLoad.randSeed);
  revealCell(state, game.value.status, createPoint(0, 2));

  assertEquals(game.value.status, "win");
  assertEquals(game.value.remainingFlags, 0);
  assertEquals(
    game.value.cellCounts.revealed,
    game.value.cellCounts.total,
  );
});

Deno.test("undoLoosingMove - undo lossing move", () => {
  const { state, game } = createMinsweeperState();
  const gameLoad = finalWaterCellGameState();
  loadGame(state, gameLoad.board, gameLoad.randSeed);
  revealCell(state, game.value.status, createPoint(2, 2));
  undoLoosingMove(state);
  assertEquals(game.value.status, "running");
  assertEquals(game.value.board, gameLoad.board);
});

Deno.test("toggleFlag - toggle flag", () => {
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(3, 3, 2), 6);
  assertEquals(game.value.board.at(2)?.at(2)?.status, "hidden");
  assertEquals(game.value.remainingFlags, 2);

  toggleFlag(state, createPoint(2, 2));
  assertEquals(game.value.board.at(2)?.at(2)?.status, "flagged");
  assertEquals(game.value.remainingFlags, 1);
});

Deno.test("toggleFlag - untoggle flag", () => {
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(3, 3, 2), 6);
  toggleFlag(state, createPoint(2, 2));
  assertEquals(game.value.board.at(2)?.at(2)?.status, "flagged");

  toggleFlag(state, createPoint(2, 2));
  assertEquals(game.value.board.at(2)?.at(2)?.status, "hidden");
  assertEquals(game.value.remainingFlags, 2);
});

Deno.test("toggleFlag - no change if toggling flag on revealed cell", () => {
  const { state, game } = createMinsweeperState();

  startGame(state, createDifficultyLevel(3, 3, 2), 6);
  revealCell(state, game.value.status, createPoint(0, 0));
  assertEquals(game.value.board.at(0)?.at(0)?.status, "revealed");

  toggleFlag(state, createPoint(0, 0));
  assertEquals(game.value.board.at(0)?.at(0)?.status, "revealed");
  assertEquals(game.value.remainingFlags, 2);
});

Deno.test("toggleFlag - negative flag count", () => {
  const { state, game } = createMinsweeperState();
  startGame(state, createDifficultyLevel(3, 3, 2), 6);

  toggleFlag(state, createPoint(2, 0));
  assertEquals(game.value.cellCounts.flagged, 1);
  assertEquals(game.value.remainingFlags, 1);

  toggleFlag(state, createPoint(2, 1));
  assertEquals(game.value.cellCounts.flagged, 2);
  assertEquals(game.value.remainingFlags, 0);

  toggleFlag(state, createPoint(2, 2));
  assertEquals(game.value.cellCounts.flagged, 3);
  assertEquals(game.value.remainingFlags, -1);

  toggleFlag(state, createPoint(2, 2));
  assertEquals(game.value.cellCounts.flagged, 2);
  assertEquals(game.value.remainingFlags, 0);

  toggleFlag(state, createPoint(2, 1));
  assertEquals(game.value.cellCounts.flagged, 1);
  assertEquals(game.value.remainingFlags, 1);

  toggleFlag(state, createPoint(2, 0));
  assertEquals(game.value.cellCounts.flagged, 0);
  assertEquals(game.value.remainingFlags, 2);
});
