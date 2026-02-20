import { describe, expect, it } from 'vitest';
import { canConnect, createBoard, createPlayableBoard, findAnyMove, removePair } from './shisen';

describe('shisen board utilities', () => {
  it('creates a board with matching pairs', () => {
    const board = createBoard(2, 2);
    expect(board).toHaveLength(2);
    expect(board[0]).toHaveLength(2);
    const values = board.flat().filter((value): value is string => value !== null);
    expect(values).toHaveLength(4);
    const unique = new Set(values);
    expect(unique.size).toBe(2);
  });

  it('detects a connectable adjacent pair', () => {
    const board = [
      ['A', 'A'],
      [null, null]
    ];
    expect(
      canConnect(board, { row: 0, col: 0 }, { row: 0, col: 1 })
    ).toBe(true);
  });

  it('removes a pair and leaves nulls', () => {
    const board = [
      ['B', 'B'],
      [null, null]
    ];
    const next = removePair(board, { row: 0, col: 0 }, { row: 0, col: 1 });
    expect(next[0][0]).toBeNull();
    expect(next[0][1]).toBeNull();
  });

  it('finds a valid move on a simple board', () => {
    const board = [
      ['C', null],
      ['C', null]
    ];
    const move = findAnyMove(board);
    expect(move).not.toBeNull();
  });

  it('generates a playable board that has at least one move', () => {
    const board = createPlayableBoard(2, 2);
    expect(findAnyMove(board)).not.toBeNull();
  });
});
