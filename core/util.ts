import { Cell, Difficulty, Grid, Minesweeper, Point } from "../core/types.ts";

/** Default difficulty levels. */
export const difficulties = {
  easy: { height: 9, width: 9, numMines: 10 },
  medium: { height: 16, width: 16, numMines: 40 },
  hard: { height: 30, width: 16, numMines: 99 },
};

/** Create a difficulty level for a minesweeper game. */
export function createDifficultyLevel(
  height: number,
  width: number,
  mines: number,
): Difficulty {
  return {
    height,
    width,
    mines,
  };
}

/** Create a coordinate. */
export function createPoint(x: number, y: number): Point {
  return ({
    x,
    y,
  });
}

/** Create a string representation of the grid. */
export function getStringifiedGrid(
  game: Minesweeper,
  showAllCells: boolean,
): string {
  return gridToString(game.board, game.difficulty.width, showAllCells);
}

/** Generate a string representation of the grid. */
function gridToString(
  grid: Grid,
  width: number,
  showAllCells: boolean,
): string {
  const outerLine = "---".repeat(grid.length || 0) + "\n";

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.mines === -1 ? "💣" : `${cell.mines}`;
    }
    switch (cell.status) {
      case "hidden":
        return "#";
      case "flagged":
        return "🚩";
      case "revealed":
        if (cell.mines === -1) {
          return "💣";
        }
        return cell.mines > 0 ? `${cell.mines}` : "🌊";
      case "detonated":
        return "💥";
    }
  };

  let gridStr = "";
  for (const [index, cell] of grid.entries()) {
    if (index === 0 || index % width === 0) {
      gridStr += "|";
    }
    const cellStr = generateCellStr(cell);
    gridStr += index === 0 ? cellStr : `, ${cellStr}`;

    if (index !== 0 && index % width === width - 1) {
      gridStr += "|\n";
    }
  }
  return outerLine + gridStr + outerLine;
}
