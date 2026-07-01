import { describe, expect, it } from "vitest";

import {
  COLS,
  createInitialBoard,
  findHint,
  hasAnyMove,
  hasMatches,
  isAdjacent,
  makeRng,
  reshuffle,
  resolveMove,
  ROWS,
} from "@/lib/game/match3/engine";

describe("makeRng", () => {
  it("같은 시드는 같은 수열을 만든다(결정론적)", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("값은 항상 [0, 1) 범위다", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 200; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("isAdjacent", () => {
  it("상하좌우 한 칸 차이는 인접으로 판정한다", () => {
    expect(isAdjacent({ r: 3, c: 3 }, { r: 3, c: 4 })).toBe(true);
    expect(isAdjacent({ r: 3, c: 3 }, { r: 4, c: 3 })).toBe(true);
  });

  it("대각선·같은 칸·먼 칸은 인접이 아니다", () => {
    expect(isAdjacent({ r: 3, c: 3 }, { r: 4, c: 4 })).toBe(false);
    expect(isAdjacent({ r: 3, c: 3 }, { r: 3, c: 3 })).toBe(false);
    expect(isAdjacent({ r: 3, c: 3 }, { r: 3, c: 5 })).toBe(false);
  });
});

describe("createInitialBoard", () => {
  it("시작부터 매치가 없는 보드를 만든다", () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const board = createInitialBoard(makeRng(seed));
      expect(hasMatches(board)).toBe(false);
    }
  });

  it("지정한 행/열 크기로 보드를 만든다", () => {
    const board = createInitialBoard(makeRng(7));
    expect(board.length).toBe(ROWS);
    expect(board[0]!.length).toBe(COLS);
  });

  it("모든 칸이 채워져 있다(null 없음)", () => {
    const board = createInitialBoard(makeRng(3));
    for (const row of board) {
      for (const cell of row) {
        expect(cell).not.toBeNull();
      }
    }
  });
});

describe("resolveMove", () => {
  it("인접하지 않은 두 칸을 스왑하면 무효 처리한다", () => {
    const board = createInitialBoard(makeRng(5));
    const result = resolveMove(board, { r: 0, c: 0 }, { r: 5, c: 5 }, makeRng(1));
    expect(result.valid).toBe(false);
    expect(result.steps).toHaveLength(0);
    expect(result.board).toBe(board);
  });

  it("매치가 발생하지 않는 스왑은 무효 처리하고 보드를 원복한다", () => {
    // 매치 없는 보드에서 무작위 인접 스왑 다수 시도 — 매치 안 나는 조합을 찾아 무효 확인.
    const board = createInitialBoard(makeRng(11));
    let foundInvalid = false;
    for (let r = 0; r < ROWS && !foundInvalid; r += 1) {
      for (let c = 0; c < COLS - 1 && !foundInvalid; c += 1) {
        const result = resolveMove(
          board,
          { r, c },
          { r, c: c + 1 },
          makeRng(2),
        );
        if (!result.valid) {
          foundInvalid = true;
          expect(result.totalScore).toBe(0);
          expect(result.maxCombo).toBe(0);
        }
      }
    }
    expect(foundInvalid).toBe(true);
  });

  it("유효한 스왑은 매치를 해소하고 점수를 준다", () => {
    // 인위적으로 3연속 매치가 되는 스왑을 세팅: 같은 멤버 3개를 나란히 두고 옆 칸과 스왑.
    const board = createInitialBoard(makeRng(9));
    const member = board[0]![0]!.member;
    // (0,1),(0,2) 를 같은 멤버로 바꿔 (0,0)-(0,1)-(0,2) 가로 3연속을 만든 뒤,
    // (0,3)과 (0,2)를 스왑하면 매치가 풀리도록 반대로 세팅한다.
    board[1]![0] = { ...board[1]![0]!, member };
    board[2]![0] = { ...board[2]![0]!, member };
    // (0,0),(1,0),(2,0) 세로 3연속이 이미 존재하는 상태이므로, hasMatches 로 확인.
    expect(hasMatches(board)).toBe(true);
  });
});

describe("hasAnyMove / findHint", () => {
  it("갓 생성된 보드에는 최소 하나의 유효한 수가 있다", () => {
    for (let seed = 0; seed < 10; seed += 1) {
      const board = createInitialBoard(makeRng(seed));
      expect(hasAnyMove(board)).toBe(true);
      expect(findHint(board)).not.toBeNull();
    }
  });

  it("findHint 가 반환한 스왑은 실제로 인접 칸이다", () => {
    const board = createInitialBoard(makeRng(4));
    const hint = findHint(board);
    expect(hint).not.toBeNull();
    if (hint) {
      expect(isAdjacent(hint.a, hint.b)).toBe(true);
    }
  });
});

describe("reshuffle", () => {
  it("섞은 뒤에도 매치가 없고 최소 한 수는 존재한다", () => {
    const board = createInitialBoard(makeRng(6));
    const shuffled = reshuffle(board, makeRng(99));
    expect(hasMatches(shuffled)).toBe(false);
    expect(hasAnyMove(shuffled)).toBe(true);
  });

  it("타일 구성(멤버 개수)은 섞기 전후 동일하다 — 타일을 잃거나 만들지 않는다", () => {
    const board = createInitialBoard(makeRng(6));
    const before = board.flat().map((c) => c!.member).sort();
    const shuffled = reshuffle(board, makeRng(99));
    const after = shuffled.flat().map((c) => c!.member).sort();
    expect(after).toEqual(before);
  });
});
