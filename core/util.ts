import {
  Cell,
  Coordinate,
  Difficulty,
  Grid,
  Minesweeper,
} from "../core/types.ts";

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
export function createCoordinate(x: number, y: number): Coordinate {
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
  return gridToString(game.board, showAllCells);
}

/** Generate a string representation of the grid. */
function gridToString(grid: Grid, showAllCells: boolean): string {
  const outerLine = "---".repeat(grid[0]?.length || 0) + "\n";

  const generateCellStr = (cell: Cell): string => {
    if (showAllCells) {
      return cell.mineCount === -1 ? "💣" : `${cell.mineCount}`;
    }
    switch (cell.status) {
      case "hidden":
        return "#";
      case "flagged":
        return "🚩";
      case "revealed":
        if (cell.mineCount === -1) {
          return "💣";
        }
        return cell.mineCount > 0 ? `${cell.mineCount}` : "🌊";
      case "detonated":
        return "💥";
    }
  };

  let gridStr = "";
  for (const row of grid) {
    gridStr += "|";
    for (const [index, col] of row.entries()) {
      const cellStr = generateCellStr(col);
      gridStr += index === 0 ? cellStr : `, ${cellStr}`;
    }
    gridStr += "|\n";
  }
  return outerLine + gridStr + outerLine;
}
