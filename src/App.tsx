import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  Board,
  Position,
  canConnect,
  createPlayableBoard,
  findAnyMove,
  isCleared,
  positionKey,
  removePair,
  shuffleRemaining
} from './game/shisen';
import './App.css';

const ROWS = 8;
const COLS = 10;

type GameState = 'playing' | 'won' | 'stuck';

function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

function createNewGame(): Board {
  return createPlayableBoard(ROWS, COLS);
}

function getStateLabel(state: GameState): string {
  switch (state) {
    case 'won':
      return 'Board cleared. Start a new game to play again.';
    case 'stuck':
      return 'No valid moves left. Use Shuffle to continue.';
    default:
      return 'Find matching tiles and connect with 2 turns or fewer.';
  }
}

function formatTileLabel(tile: string): string {
  return tile
    .replace(/^\d+-/, '')
    .replace(/\.svg$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function App() {
  const [board, setBoard] = useState<Board | null>(null);
  const [selected, setSelected] = useState<Position[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<GameState>('playing');
  const assetBase = import.meta.env.BASE_URL ?? '/';
  const [showShufflePrompt, setShowShufflePrompt] = useState(false);
  const [hinted, setHinted] = useState<Position[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSolving, setIsSolving] = useState(false);

  const selectedKeys = useMemo(() => new Set(selected.map(positionKey)), [selected]);
  const hintedKeys = useMemo(() => new Set(hinted.map(positionKey)), [hinted]);
  const hint = useMemo(() => (board ? findAnyMove(board) : null), [board]);

  const evaluateBoard = (nextBoard: Board) => {
    if (isCleared(nextBoard)) {
      setState('won');
      setIsSolving(false);
      return;
    }

    setState(findAnyMove(nextBoard) ? 'playing' : 'stuck');
  };

  const generateBoard = async () => {
    setIsGenerating(true);
    setShowShufflePrompt(false);
    setSelected([]);
    setHinted([]);
    setIsSolving(false);
    setState('playing');
    const nextBoard = await new Promise<Board>((resolve) => {
      const idleCallback = (
        globalThis as { requestIdleCallback?: (cb: () => void) => number }
      ).requestIdleCallback;
      if (idleCallback) {
        idleCallback(() => resolve(createNewGame()));
      } else {
        setTimeout(() => resolve(createNewGame()), 0);
      }
    });
    setBoard(nextBoard);
    setMoves(0);
    setScore(0);
    setIsGenerating(false);
  };

  const handleNewGame = () => {
    void generateBoard();
  };

  const handleShuffle = () => {
    if (state === 'won' || !board) {
      return;
    }

    let candidate = shuffleRemaining(board);
    for (let attempt = 0; attempt < 40 && !findAnyMove(candidate); attempt += 1) {
      candidate = shuffleRemaining(candidate);
    }

    setBoard(candidate);
    setSelected([]);
    setHinted([]);
    setIsSolving(false);
    setState(findAnyMove(candidate) ? 'playing' : 'stuck');
    setShowShufflePrompt(false);
  };

  const handleTileClick = (position: Position) => {
    if (state === 'won' || !board) {
      return;
    }

    if (isSolving) {
      setIsSolving(false);
    }

    const tile = board[position.row][position.col];
    if (!tile) {
      return;
    }

    if (selected.length === 0) {
      setSelected([position]);
      setHinted([]);
      return;
    }

    const first = selected[0];
    if (samePosition(first, position)) {
      setSelected([]);
      return;
    }

    const firstTile = board[first.row][first.col];
    if (firstTile === tile && canConnect(board, first, position)) {
      const nextBoard = removePair(board, first, position);
      setBoard(nextBoard);
      setSelected([]);
      setIsSolving(false);
      setHinted([]);
      setMoves((value) => value + 1);
      setScore((value) => value + 10);
      evaluateBoard(nextBoard);
      return;
    }

    setSelected([position]);
    setIsSolving(false);
    setHinted([]);
  };

  const handleHint = () => {
    if (!hint) {
      return;
    }
    setHinted(hint);
  };

  const handleToggleSolve = () => {
    if (!board) {
      return;
    }
    setIsSolving((value) => !value);
  };

  useEffect(() => {
    setShowShufflePrompt(state === 'stuck');
  }, [state]);

  useEffect(() => {
    void generateBoard();
  }, []);

  useEffect(() => {
    if (!isSolving || !board) {
      return;
    }

    const move = findAnyMove(board);
    if (!move) {
      setIsSolving(false);
      return;
    }

    setHinted(move);
    const timeout = window.setTimeout(() => {
      const nextBoard = removePair(board, move[0], move[1]);
      setBoard(nextBoard);
      setSelected([]);
      setHinted([]);
      setMoves((value) => value + 1);
      setScore((value) => value + 10);
      evaluateBoard(nextBoard);
    }, 650);

    return () => window.clearTimeout(timeout);
  }, [isSolving, board]);

  useEffect(() => {
    if (hinted.length === 0) {
      return;
    }
    const timeout = window.setTimeout(() => setHinted([]), 2000);
    return () => window.clearTimeout(timeout);
  }, [hinted]);

  return (
    <main className="app-shell">
      <section className="game-panel">
        <header className="game-header" />

        <section className="actions">
          <div className="stats-inline" aria-label="game statistics">
            <span>
              Score <strong>{score}</strong>
            </span>
            <span>
              Matches <strong>{moves}</strong>
            </span>
            <span>
              Moves Left <strong>{hint ? 'Yes' : 'No'}</strong>
            </span>
          </div>
          <button type="button" onClick={handleNewGame} disabled={isGenerating}>
            New Game
          </button>
          <button type="button" onClick={handleShuffle} disabled={isGenerating || !board}>
            Shuffle
          </button>
          <button type="button" onClick={handleHint} disabled={isGenerating || !hint}>
            Hint
          </button>
          <button
            type="button"
            onClick={handleToggleSolve}
            disabled={isGenerating || !board || state === 'won'}
          >
            {isSolving ? 'Stop Solve' : 'Solve'}
          </button>
        </section>

        <section
          className="board"
          style={{ '--cols': COLS } as CSSProperties}
          aria-label="Shisen-Sho board"
        >
          {board
            ? board.flatMap((row, rowIndex) =>
                row.map((tile, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const position = { row: rowIndex, col: colIndex };
                  const isSelected = selectedKeys.has(positionKey(position));

                  return (
                    <button
                      key={key}
                      className={`tile ${isSelected ? 'selected' : ''} ${
                        hintedKeys.has(positionKey(position)) ? 'hinted' : ''
                      } ${tile ? '' : 'empty'}`}
                      onClick={() => handleTileClick(position)}
                      type="button"
                      disabled={!tile}
                      aria-label={tile ? `Tile ${formatTileLabel(tile)}` : 'Empty tile'}
                    >
                      {tile ? (
                        <img
                          src={`${assetBase}tiles/hongkong/${tile}`}
                          alt={formatTileLabel(tile)}
                        />
                      ) : null}
                    </button>
                  );
                })
              )
            : null}
        </section>
      </section>

      {isGenerating ? (
        <div className="overlay" role="status" aria-live="polite" aria-label="Generating board">
          <div className="popover popover-loading">
            <div className="spinner" aria-hidden="true" />
            <div>
              <p className="popover-title">Generating Board</p>
              <p className="popover-body">Finding a solvable layout…</p>
            </div>
          </div>
        </div>
      ) : null}

      {showShufflePrompt && !isGenerating ? (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="No moves left">
          <div className="popover">
            <p className="popover-title">No Moves Left</p>
            <p className="popover-body">
              Shuffle the remaining tiles to keep playing.
            </p>
            <div className="popover-actions">
              <button type="button" onClick={handleShuffle}>
                Shuffle Tiles
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => setShowShufflePrompt(false)}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
