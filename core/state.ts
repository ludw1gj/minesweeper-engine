import { computed, signal } from "@preact/signals";
import { GameStatus, Grid, Minesweeper, MinesweeperState } from "./types.ts";

export function createMinsweeperState() {
  const state = signal<MinesweeperState>({
    difficulty: {
      height: 0,
      width: 0,
      mines: 0,
    },
    board: [[]],
    savedBoard: undefined,
    randSeed: 1,
  });

  const game = computed<Minesweeper>(() => {
    const currentState = state.value;
    const cellCounts = countCells(currentState.board);
    const status = calcStatus(
      cellCounts.total,
      cellCounts.revealed,
      cellCounts.detonated,
    );
    return {
      ...currentState,
      cellCounts,
      status,
      remainingFlags: status === "win" || status === "loss"
        ? 0
        : currentState.difficulty.mines - cellCounts.flagged,
    };
  });

  return { state, game };
}

function countCells(board: Grid) {
  const count = { revealed: 0, flagged: 0, detonated: 0, total: 0 };
  for (const row of board) {
    for (const cell of row) {
      if (cell.status === "revealed") {
        count.revealed++;
      }
      if (cell.status === "flagged") {
        count.flagged++;
      }
      if (cell.status === "detonated") {
        count.detonated++;
      }
      count.total++;
    }
  }
  return count;
}

function calcStatus(
  total: number,
  revealed: number,
  detonated: number,
): GameStatus {
  if (total === 0) {
    return "waiting";
  }
  if (revealed === 0) {
    return "ready";
  }
  if (detonated > 0) {
    return "loss";
  }
  if (total === revealed) {
    return "win";
  }
  return "running";
}
