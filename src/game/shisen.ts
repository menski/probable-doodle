export type Tile = string | null;
export type Board = Tile[][];

export interface Position {
  row: number;
  col: number;
}

const TILE_SET: ReadonlyArray<string> = [
  '01-white-dragon.svg',
  '02-green-dragon.svg',
  '03-red-dragon.svg',
  '04-east-wind.svg',
  '05-south-wind.svg',
  '06-west-wind.svg',
  '07-north-wind.svg',
  '08-characters-1.svg',
  '09-characters-2.svg',
  '10-characters-3.svg',
  '11-characters-4.svg',
  '12-characters-5.svg',
  '13-characters-6.svg',
  '14-characters-7.svg',
  '15-characters-8.svg',
  '16-characters-9.svg',
  '17-circles-1.svg',
  '18-circles-2.svg',
  '19-circles-3.svg',
  '20-circles-4.svg',
  '21-circles-5.svg',
  '22-circles-6.svg',
  '23-circles-7.svg',
  '24-circles-8.svg',
  '25-circles-9.svg',
  '26-bamboos-1.svg',
  '27-bamboos-2.svg',
  '28-bamboos-3.svg',
  '29-bamboos-4.svg',
  '30-bamboos-5.svg',
  '31-bamboos-6.svg',
  '32-bamboos-7.svg',
  '33-bamboos-8.svg',
  '34-bamboos-9.svg',
  '35-spring.svg',
  '36-summer.svg',
  '37-autumn.svg',
  '38-winter.svg',
  '39-plum.svg',
  '40-orchid.svg'
];
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getTiles(count: number): string[] {
  if (count > TILE_SET.length) {
    throw new Error(`Tile set has ${TILE_SET.length} unique tiles; need ${count}.`);
  }
  return TILE_SET.slice(0, count);
}

function inBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && col >= 0 && row < rows && col < cols;
}

function areSamePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function createBoard(rows: number, cols: number): Board {
  const total = rows * cols;
  if (total % 2 !== 0) {
    throw new Error('Board must have an even number of cells.');
  }

  const pairCount = total / 2;
  const tiles = getTiles(pairCount);
  const deck = shuffle(tiles.flatMap((tile) => [tile, tile]));

  const board: Board = [];
  for (let row = 0; row < rows; row += 1) {
    const rowCells: Tile[] = [];
    for (let col = 0; col < cols; col += 1) {
      rowCells.push(deck[row * cols + col]);
    }
    board.push(rowCells);
  }

  return board;
}

export function canConnect(board: Board, first: Position, second: Position): boolean {
  if (areSamePosition(first, second)) {
    return false;
  }

  const valueA = board[first.row]?.[first.col];
  const valueB = board[second.row]?.[second.col];
  if (!valueA || !valueB || valueA !== valueB) {
    return false;
  }

  const rows = board.length + 2;
  const cols = board[0].length + 2;

  const start = { row: first.row + 1, col: first.col + 1 };
  const end = { row: second.row + 1, col: second.col + 1 };

  const blocked = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[0].length; col += 1) {
      if (board[row][col] !== null) {
        blocked[row + 1][col + 1] = true;
      }
    }
  }

  blocked[start.row][start.col] = false;
  blocked[end.row][end.col] = false;

  const visited = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Array<number>(4).fill(Number.POSITIVE_INFINITY))
  );

  type State = {
    row: number;
    col: number;
    dir: number;
    turns: number;
  };

  const queue: State[] = [];
  for (let dir = 0; dir < DIRECTIONS.length; dir += 1) {
    const [dRow, dCol] = DIRECTIONS[dir];
    const nextRow = start.row + dRow;
    const nextCol = start.col + dCol;

    if (!inBounds(nextRow, nextCol, rows, cols)) {
      continue;
    }

    if (blocked[nextRow][nextCol] && !(nextRow === end.row && nextCol === end.col)) {
      continue;
    }

    visited[nextRow][nextCol][dir] = 0;
    queue.push({ row: nextRow, col: nextCol, dir, turns: 0 });
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current.row === end.row && current.col === end.col) {
      return true;
    }

    for (let nextDir = 0; nextDir < DIRECTIONS.length; nextDir += 1) {
      const [dRow, dCol] = DIRECTIONS[nextDir];
      const nextRow = current.row + dRow;
      const nextCol = current.col + dCol;
      const nextTurns = current.turns + (nextDir === current.dir ? 0 : 1);

      if (nextTurns > 2 || !inBounds(nextRow, nextCol, rows, cols)) {
        continue;
      }

      if (blocked[nextRow][nextCol] && !(nextRow === end.row && nextCol === end.col)) {
        continue;
      }

      if (visited[nextRow][nextCol][nextDir] <= nextTurns) {
        continue;
      }

      visited[nextRow][nextCol][nextDir] = nextTurns;
      queue.push({ row: nextRow, col: nextCol, dir: nextDir, turns: nextTurns });
    }
  }

  return false;
}

export function removePair(board: Board, first: Position, second: Position): Board {
  const next = board.map((row) => [...row]);
  next[first.row][first.col] = null;
  next[second.row][second.col] = null;
  return next;
}

export function isCleared(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell === null));
}

export function findAnyMove(board: Board): [Position, Position] | null {
  const positionsByValue = new Map<string, Position[]>();

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[0].length; col += 1) {
      const value = board[row][col];
      if (!value) {
        continue;
      }

      const existing = positionsByValue.get(value);
      if (existing) {
        existing.push({ row, col });
      } else {
        positionsByValue.set(value, [{ row, col }]);
      }
    }
  }

  for (const positions of positionsByValue.values()) {
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        if (canConnect(board, positions[i], positions[j])) {
          return [positions[i], positions[j]];
        }
      }
    }
  }

  return null;
}

function serializeBoard(board: Board): string {
  return board.map((row) => row.map((cell) => cell ?? '.').join(',')).join('|');
}

function findAllMoves(board: Board): Array<[Position, Position, number]> {
  const positionsByValue = new Map<string, Position[]>();

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[0].length; col += 1) {
      const value = board[row][col];
      if (!value) {
        continue;
      }

      const existing = positionsByValue.get(value);
      if (existing) {
        existing.push({ row, col });
      } else {
        positionsByValue.set(value, [{ row, col }]);
      }
    }
  }

  const moves: Array<[Position, Position, number]> = [];
  for (const positions of positionsByValue.values()) {
    const weight = positions.length;
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        if (canConnect(board, positions[i], positions[j])) {
          moves.push([positions[i], positions[j], weight]);
        }
      }
    }
  }

  moves.sort((a, b) => a[2] - b[2]);
  return moves;
}

function isSolvable(board: Board, memo: Map<string, boolean>): boolean {
  if (isCleared(board)) {
    return true;
  }

  const key = serializeBoard(board);
  const cached = memo.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const moves = findAllMoves(board);
  if (moves.length === 0) {
    memo.set(key, false);
    return false;
  }

  for (const [first, second] of moves) {
    const next = removePair(board, first, second);
    if (isSolvable(next, memo)) {
      memo.set(key, true);
      return true;
    }
  }

  memo.set(key, false);
  return false;
}

export function shuffleRemaining(board: Board): Board {
  const values: string[] = [];
  for (const row of board) {
    for (const cell of row) {
      if (cell) {
        values.push(cell);
      }
    }
  }

  const shuffled = shuffle(values);
  let index = 0;
  return board.map((row) =>
    row.map((cell) => {
      if (!cell) {
        return null;
      }
      const next = shuffled[index];
      index += 1;
      return next;
    })
  );
}

export function createPlayableBoard(rows: number, cols: number): Board {
  for (;;) {
    const board = createBoard(rows, cols);
    if (isSolvable(board, new Map())) {
      return board;
    }
  }
}

export function positionKey(position: Position): string {
  return `${position.row}:${position.col}`;
}
