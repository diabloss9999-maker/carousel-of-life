/**
 * match-3 퍼즐 엔진 — 순수 로직(React 무관).
 *
 * 보드 생성(초기 매치 없음) · 인접 스왑 · 매치 탐지 · 특수타일 생성(4=라인,
 * 5=레인보우, 교차=폭탄) · 특수 발동 연쇄 · 중력/리필 · 캐스케이드 · 점수.
 * 한 수의 해소는 ResolveStep[] 로 돌려 UI 가 단계별로 애니메이션한다.
 */
import type { CharacterId } from "@/lib/chat/characters";
import { MEMBER_TILES } from "@/lib/game/match3/tiles";
import type {
  Board,
  Cell,
  Pos,
  ResolveResult,
  ResolveStep,
  SpecialKind,
} from "@/lib/game/match3/types";

export const ROWS = 8;
export const COLS = 8;

const BASE_SCORE = 10;

const MEMBERS: readonly CharacterId[] = MEMBER_TILES.map((t) => t.member);

// ── RNG (seedable) ──────────────────────────────────────────────────────────
export type Rng = () => number;

/** mulberry32 — 시드 가능한 결정론적 난수(0~1). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 타일 id 발급(애니메이션 key 안정용, 전역 단조 증가) ─────────────────────
let _id = 1;
export function resetIds(): void {
  _id = 1;
}
function uid(): number {
  _id += 1;
  return _id;
}

function memberCell(member: CharacterId): Cell {
  return { id: uid(), member, special: "none" };
}

function randomMember(rng: Rng): CharacterId {
  return MEMBERS[Math.floor(rng() * MEMBERS.length)]!;
}

// ── 보드 헬퍼 ────────────────────────────────────────────────────────────────
function inBounds(board: Board, r: number, c: number): boolean {
  return r >= 0 && r < board.length && c >= 0 && c < board[0]!.length;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function isAdjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

/**
 * 초기 보드 — 시작부터 매치가 없도록 좌/상 이웃과 3연속이 되면 다른 멤버로 다시 뽑는다.
 */
export function createInitialBoard(rng: Rng, rows = ROWS, cols = COLS): Board {
  const board: Board = [];
  for (let r = 0; r < rows; r += 1) {
    const row: (Cell | null)[] = [];
    for (let c = 0; c < cols; c += 1) {
      let member = randomMember(rng);
      let guard = 0;
      while (guard < 20) {
        const twoLeft =
          c >= 2 && row[c - 1]?.member === member && row[c - 2]?.member === member;
        const twoUp =
          r >= 2 &&
          board[r - 1]?.[c]?.member === member &&
          board[r - 2]?.[c]?.member === member;
        if (!twoLeft && !twoUp) break;
        member = randomMember(rng);
        guard += 1;
      }
      row.push(memberCell(member));
    }
    board.push(row);
  }
  return board;
}

// ── 매치 탐지 ────────────────────────────────────────────────────────────────
interface Run {
  cells: Pos[];
  dir: "h" | "v";
  member: CharacterId;
}

/** member 가 같고(특수 rainbow 제외) 가로/세로 3연속 이상인 모든 run. */
function findRuns(board: Board): Run[] {
  const runs: Run[] = [];
  const rows = board.length;
  const cols = board[0]!.length;

  const scan = (dir: "h" | "v") => {
    const outer = dir === "h" ? rows : cols;
    const inner = dir === "h" ? cols : rows;
    for (let o = 0; o < outer; o += 1) {
      let start = 0;
      while (start < inner) {
        const cellAt = (i: number) =>
          dir === "h" ? board[o]![i]! : board[i]![o]!;
        const first = cellAt(start);
        const m = first?.member ?? null;
        let end = start + 1;
        if (m !== null) {
          while (end < inner) {
            const next = cellAt(end);
            if (next?.member === m) end += 1;
            else break;
          }
        }
        const len = end - start;
        if (m !== null && len >= 3) {
          const cells: Pos[] = [];
          for (let i = start; i < end; i += 1) {
            cells.push(dir === "h" ? { r: o, c: i } : { r: i, c: o });
          }
          runs.push({ cells, dir, member: m });
        }
        start = end;
      }
    }
  };

  scan("h");
  scan("v");
  return runs;
}

const key = (p: Pos) => p.r * 1000 + p.c;

/** 보드에 매치(3연속 이상)가 하나라도 있는지. */
export function hasMatches(board: Board): boolean {
  return findRuns(board).length > 0;
}

// ── 특수타일 생성 결정 ───────────────────────────────────────────────────────
interface Created {
  pos: Pos;
  special: SpecialKind;
  member: CharacterId | null;
}

/** run 들에서 생성할 특수타일을 정한다. swap 위치를 우선 배치한다. */
function decideCreations(runs: Run[], swap: Pos[] | null): Created[] {
  const created = new Map<number, Created>();
  const hRuns = runs.filter((r) => r.dir === "h");
  const vRuns = runs.filter((r) => r.dir === "v");

  const swapKeys = new Set((swap ?? []).map(key));
  const chosenPos = (run: Run): Pos => {
    const onSwap = run.cells.find((p) => swapKeys.has(key(p)));
    return onSwap ?? run.cells[Math.floor(run.cells.length / 2)]!;
  };

  // 1) 교차(L/T) → 폭탄.
  const hSet = new Set<number>();
  hRuns.forEach((run) => run.cells.forEach((p) => hSet.add(key(p))));
  vRuns.forEach((run) =>
    run.cells.forEach((p) => {
      if (hSet.has(key(p)) && !created.has(key(p))) {
        created.set(key(p), { pos: p, special: "bomb", member: run.member });
      }
    }),
  );

  // 2) 길이 5+ 직선 → 레인보우.
  runs
    .filter((run) => run.cells.length >= 5)
    .forEach((run) => {
      const pos = chosenPos(run);
      if (!created.has(key(pos))) {
        created.set(key(pos), { pos, special: "rainbow", member: null });
      }
    });

  // 3) 길이 4 직선 → 라인 클리어.
  runs
    .filter((run) => run.cells.length === 4)
    .forEach((run) => {
      const pos = chosenPos(run);
      if (!created.has(key(pos))) {
        created.set(key(pos), {
          pos,
          special: run.dir === "h" ? "rowClear" : "colClear",
          member: run.member,
        });
      }
    });

  return [...created.values()];
}

// ── 특수 발동 연쇄(이미 보드에 있던 특수가 제거에 휘말리면 효과 확장) ─────────
function expandClears(
  board: Board,
  seeds: Pos[],
  protectedKeys: Set<number>,
): Set<number> {
  const rows = board.length;
  const cols = board[0]!.length;
  const cleared = new Set<number>();
  const queue: Pos[] = [...seeds];

  while (queue.length > 0) {
    const p = queue.pop()!;
    const k = key(p);
    if (cleared.has(k)) continue;
    cleared.add(k);

    const cell = inBounds(board, p.r, p.c) ? board[p.r]![p.c] : null;
    if (!cell || cell.special === "none") continue;
    if (protectedKeys.has(k)) continue; // 이번에 새로 만든 특수는 발동하지 않음

    const add = (r: number, c: number) => {
      if (inBounds(board, r, c)) queue.push({ r, c });
    };
    if (cell.special === "rowClear") {
      for (let c = 0; c < cols; c += 1) add(p.r, c);
    } else if (cell.special === "colClear") {
      for (let r = 0; r < rows; r += 1) add(r, p.c);
    } else if (cell.special === "bomb" || cell.special === "rainbow") {
      for (let r = p.r - 1; r <= p.r + 1; r += 1)
        for (let c = p.c - 1; c <= p.c + 1; c += 1) add(r, c);
    }
  }
  return cleared;
}

// ── 중력 + 리필 ──────────────────────────────────────────────────────────────
function collapse(board: Board, rng: Rng): Board {
  const rows = board.length;
  const cols = board[0]!.length;
  const next = cloneBoard(board);
  for (let c = 0; c < cols; c += 1) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r -= 1) {
      const cell = next[r]![c];
      if (cell) {
        next[write]![c] = cell;
        if (write !== r) next[r]![c] = null;
        write -= 1;
      }
    }
    for (let r = write; r >= 0; r -= 1) {
      next[r]![c] = memberCell(randomMember(rng));
    }
  }
  return next;
}

// ── 한 단계 해소 ─────────────────────────────────────────────────────────────
function clearedToPositions(cleared: Set<number>): Pos[] {
  return [...cleared].map((k) => ({ r: Math.floor(k / 1000), c: k % 1000 }));
}

/**
 * 매치를 1단계 해소한다. 매치가 없으면 null.
 * @param swap 이번이 첫 단계면 스왑 좌표(특수 배치 우선). 연쇄 단계면 null.
 */
function resolveOnce(
  board: Board,
  swap: Pos[] | null,
  combo: number,
  rng: Rng,
): { step: ResolveStep; board: Board } | null {
  const runs = findRuns(board);
  if (runs.length === 0) return null;

  const created = decideCreations(runs, swap);
  const createdKeys = new Set(created.map((c) => key(c.pos)));

  const matchedSeeds: Pos[] = [];
  runs.forEach((run) => run.cells.forEach((p) => matchedSeeds.push(p)));

  const clearedSet = expandClears(board, matchedSeeds, createdKeys);
  // 새로 만든 특수 자리는 사라지지 않고 특수타일로 변신.
  created.forEach((c) => clearedSet.delete(key(c.pos)));

  const next = cloneBoard(board);
  // 특수타일 배치.
  created.forEach((c) => {
    next[c.pos.r]![c.pos.c] = {
      id: uid(),
      member: c.member,
      special: c.special,
    };
  });
  // 매치/발동 칸 제거.
  clearedSet.forEach((k) => {
    const r = Math.floor(k / 1000);
    const c = k % 1000;
    next[r]![c] = null;
  });

  const hadSpecial =
    created.length > 0 ||
    clearedToPositions(clearedSet).some((p) => {
      const cell = board[p.r]?.[p.c];
      return cell != null && cell.special !== "none";
    });

  const settled = collapse(next, rng);
  const clearedCount = clearedSet.size;
  const score = clearedCount * BASE_SCORE * (combo + 1) + created.length * 40;

  const step: ResolveStep = {
    cleared: clearedToPositions(clearedSet),
    created: created.map((c) => ({
      pos: c.pos,
      special: c.special,
      member: c.member,
    })),
    score,
    combo,
    board: settled,
    hadSpecial,
  };
  return { step, board: settled };
}

// ── 레인보우 스왑 발동 ───────────────────────────────────────────────────────
function rainbowClearSeeds(board: Board, a: Pos, b: Pos): Pos[] {
  const ca = board[a.r]![a.c]!;
  const cb = board[b.r]![b.c]!;
  const rows = board.length;
  const cols = board[0]!.length;
  const seeds: Pos[] = [a, b];

  const bothRainbow = ca.special === "rainbow" && cb.special === "rainbow";
  if (bothRainbow) {
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) seeds.push({ r, c });
    return seeds;
  }
  // 한쪽만 레인보우 → 상대 멤버 전체 제거.
  const target = ca.special === "rainbow" ? cb.member : ca.member;
  if (target != null) {
    for (let r = 0; r < rows; r += 1)
      for (let c = 0; c < cols; c += 1) {
        if (board[r]![c]?.member === target) seeds.push({ r, c });
      }
  }
  return seeds;
}

// ── 공개 진입점 ──────────────────────────────────────────────────────────────
/**
 * 두 칸을 스왑해 한 수를 끝까지 해소한다. 유효하지 않으면 valid:false + 원본 보드.
 */
export function resolveMove(
  board: Board,
  a: Pos,
  b: Pos,
  rng: Rng,
): ResolveResult {
  const empty: ResolveResult = {
    valid: false,
    steps: [],
    totalScore: 0,
    board,
    maxCombo: 0,
    totalCleared: 0,
  };
  if (!isAdjacent(a, b)) return empty;
  const ca = board[a.r]?.[a.c];
  const cb = board[b.r]?.[b.c];
  if (!ca || !cb) return empty;

  const swapped = cloneBoard(board);
  swapped[a.r]![a.c] = { ...cb };
  swapped[b.r]![b.c] = { ...ca };

  const steps: ResolveStep[] = [];
  let work = swapped;
  let combo = 0;
  let totalScore = 0;
  let totalCleared = 0;

  const isRainbowMove = ca.special === "rainbow" || cb.special === "rainbow";

  if (isRainbowMove) {
    const seeds = rainbowClearSeeds(swapped, a, b);
    const clearedSet = expandClears(swapped, seeds, new Set());
    const next = cloneBoard(swapped);
    clearedSet.forEach((k) => {
      next[Math.floor(k / 1000)]![k % 1000] = null;
    });
    const settled = collapse(next, rng);
    const score = clearedSet.size * BASE_SCORE * 2;
    steps.push({
      cleared: clearedToPositions(clearedSet),
      created: [],
      score,
      combo: 0,
      board: settled,
      hadSpecial: true,
    });
    totalScore += score;
    totalCleared += clearedSet.size;
    work = settled;
    combo = 1;
  } else {
    // 일반 스왑: 첫 단계에서 매치가 없으면 무효.
    const first = resolveOnce(work, [a, b], 0, rng);
    if (!first) return empty;
    steps.push(first.step);
    totalScore += first.step.score;
    totalCleared += first.step.cleared.length;
    work = first.board;
    combo = 1;
  }

  // 캐스케이드.
  let guard = 0;
  while (guard < 64) {
    const res = resolveOnce(work, null, combo, rng);
    if (!res) break;
    steps.push(res.step);
    totalScore += res.step.score;
    totalCleared += res.step.cleared.length;
    work = res.board;
    combo += 1;
    guard += 1;
  }

  return {
    valid: true,
    steps,
    totalScore,
    board: work,
    maxCombo: combo,
    totalCleared,
  };
}

/** 보드에 매치 가능한 수가 하나라도 있는지(없으면 셔플 필요). */
export function hasAnyMove(board: Board): boolean {
  const rows = board.length;
  const cols = board[0]!.length;
  const test = (a: Pos, b: Pos): boolean => {
    const t = cloneBoard(board);
    const tmp = t[a.r]![a.c];
    t[a.r]![a.c] = t[b.r]![b.c];
    t[b.r]![b.c] = tmp;
    // 특수타일이면 항상 유효한 수로 간주.
    if (
      board[a.r]![a.c]?.special === "rainbow" ||
      board[b.r]![b.c]?.special === "rainbow"
    )
      return true;
    return findRuns(t).length > 0;
  };
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c + 1 < cols && test({ r, c }, { r, c: c + 1 })) return true;
      if (r + 1 < rows && test({ r, c }, { r: r + 1, c })) return true;
    }
  }
  return false;
}

/** 지금 둘 수 있는 한 수(힌트)를 찾는다. 없으면 null. */
export function findHint(board: Board): { a: Pos; b: Pos } | null {
  const rows = board.length;
  const cols = board[0]!.length;
  const yields = (a: Pos, b: Pos): boolean => {
    if (
      board[a.r]![a.c]?.special === "rainbow" ||
      board[b.r]![b.c]?.special === "rainbow"
    )
      return true;
    const t = cloneBoard(board);
    const tmp = t[a.r]![a.c];
    t[a.r]![a.c] = t[b.r]![b.c];
    t[b.r]![b.c] = tmp;
    return findRuns(t).length > 0;
  };
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c + 1 < cols && yields({ r, c }, { r, c: c + 1 }))
        return { a: { r, c }, b: { r, c: c + 1 } };
      if (r + 1 < rows && yields({ r, c }, { r: r + 1, c }))
        return { a: { r, c }, b: { r: r + 1, c } };
    }
  }
  return null;
}

/** 매치 가능한 수가 없을 때 — 멤버를 섞어 매치 없는 새 배치를 만든다. */
export function reshuffle(board: Board, rng: Rng): Board {
  const flat: Cell[] = [];
  board.forEach((row) => row.forEach((cell) => cell && flat.push(cell)));
  let guard = 0;
  while (guard < 40) {
    for (let i = flat.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [flat[i], flat[j]] = [flat[j]!, flat[i]!];
    }
    const rows = board.length;
    const cols = board[0]!.length;
    const next: Board = [];
    let idx = 0;
    for (let r = 0; r < rows; r += 1) {
      const row: (Cell | null)[] = [];
      for (let c = 0; c < cols; c += 1) row.push(flat[idx++]!);
      next.push(row);
    }
    if (findRuns(next).length === 0 && hasAnyMove(next)) return next;
    guard += 1;
  }
  return createInitialBoard(rng, board.length, board[0]!.length);
}
