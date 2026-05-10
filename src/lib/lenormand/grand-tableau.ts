/**
 * 르노르망 그랑 타블로(Grand Tableau) 분석 유틸리티.
 *
 * 전통적인 8×4 + 하단 영혼 카드 4장 레이아웃 기준으로
 * 시그니피케이터(신사=28번, 숙녀=29번)의 위치를 중심으로
 * 인접·동행/동렬·영혼 카드를 분석한다.
 */
import "server-only";

import type { LenormandCard } from "@/lib/lenormand/cards";

/** 시그니피케이터 카드 ID (남성 = 신사, 여성 = 숙녀). */
const SIG_ID_MALE = 28;
const SIG_ID_FEMALE = 29;

/** 그리드 폭(열 수). */
const GRID_COLS = 8;
/** 그리드 행 수(영혼 카드 제외). */
const GRID_ROWS = 4;

/**
 * 32장 그리드 안에서의 행 번호(0~3).
 * 32~35번 위치(영혼 카드)는 4를 반환한다.
 */
export function getRow(pos: number): number {
  if (pos < GRID_COLS * GRID_ROWS) return Math.floor(pos / GRID_COLS);
  return 4;
}

/**
 * 32장 그리드 안에서의 열 번호(0~7).
 * 32~35번 위치(영혼 카드)는 가운데(2~5)에 정렬되도록 col 을 계산한다.
 */
export function getCol(pos: number): number {
  if (pos < GRID_COLS * GRID_ROWS) return pos % GRID_COLS;
  return pos - GRID_COLS * GRID_ROWS + 2;
}

export interface SurroundingCards {
  top: LenormandCard | null;
  bottom: LenormandCard | null;
  left: LenormandCard | null;
  right: LenormandCard | null;
  topLeft: LenormandCard | null;
  topRight: LenormandCard | null;
  bottomLeft: LenormandCard | null;
  bottomRight: LenormandCard | null;
}

export interface GrandTableauAnalysis {
  /** 시그니피케이터 카드의 위치(0~35). */
  significatorPos: number;
  /** 시그니피케이터 카드 자체. */
  significatorCard: LenormandCard;
  /** 같은 행에서 시그니피케이터 왼쪽에 있는 카드들 (과거). */
  pastCards: LenormandCard[];
  /** 같은 행에서 시그니피케이터 오른쪽에 있는 카드들 (미래). */
  futureCards: LenormandCard[];
  /** 시그니피케이터를 둘러싼 8방향 카드. */
  surrounding: SurroundingCards;
  /** 시그니피케이터와 같은 행 전체. */
  sameRow: LenormandCard[];
  /** 시그니피케이터와 같은 열 전체(영혼 카드 제외 — 4개). */
  sameCol: LenormandCard[];
  /** 하단 영혼 카드(위치 32~35). */
  soulCards: LenormandCard[];
}

/**
 * 36장 배열을 받아 그랑 타블로 분석 결과를 만든다.
 *
 * @param cards 36장 카드 (위치 0~35 순서로).
 * @param gender 시그니피케이터 결정용 성별.
 * @throws 시그니피케이터 카드가 덱에서 발견되지 않은 경우.
 */
export function analyzeGrandTableau(
  cards: LenormandCard[],
  gender: "male" | "female",
): GrandTableauAnalysis {
  if (cards.length !== 36) {
    throw new Error(
      `그랑 타블로는 정확히 36장이 필요해요 (받음: ${cards.length}).`,
    );
  }

  const sigId = gender === "male" ? SIG_ID_MALE : SIG_ID_FEMALE;
  const sigPos = cards.findIndex((c) => c.id === sigId);
  const sigCard = cards[sigPos];
  if (sigPos < 0 || !sigCard) {
    throw new Error(
      `시그니피케이터(id=${sigId}) 카드를 그랑 타블로에서 찾지 못했어요.`,
    );
  }

  const sigRow = getRow(sigPos);
  const sigCol = getCol(sigPos);

  // 같은 행 전체와 과거/미래 분기.
  let sameRow: LenormandCard[] = [];
  let pastCards: LenormandCard[] = [];
  let futureCards: LenormandCard[] = [];

  if (sigPos < GRID_COLS * GRID_ROWS) {
    const rowStart = sigRow * GRID_COLS;
    const rowEnd = rowStart + GRID_COLS;
    sameRow = cards.slice(rowStart, rowEnd);
    pastCards = cards.slice(rowStart, sigPos);
    futureCards = cards.slice(sigPos + 1, rowEnd);
  } else {
    // 영혼 카드 라인 — 같은 행은 영혼 카드 전체.
    sameRow = cards.slice(GRID_COLS * GRID_ROWS, 36);
    const localIdx = sigPos - GRID_COLS * GRID_ROWS;
    pastCards = sameRow.slice(0, localIdx);
    futureCards = sameRow.slice(localIdx + 1);
  }

  /**
   * (row, col) 위치에 해당하는 카드를 안전하게 반환한다.
   * 그리드 범위를 벗어나면 null.
   */
  function getAt(row: number, col: number): LenormandCard | null {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
      return null;
    }
    return cards[row * GRID_COLS + col] ?? null;
  }

  // 시그니피케이터가 영혼 카드 위치(row=4)일 때는 8방향이 무의미하므로 모두 null.
  const surrounding: SurroundingCards =
    sigPos < GRID_COLS * GRID_ROWS
      ? {
          top: getAt(sigRow - 1, sigCol),
          bottom: getAt(sigRow + 1, sigCol),
          left: getAt(sigRow, sigCol - 1),
          right: getAt(sigRow, sigCol + 1),
          topLeft: getAt(sigRow - 1, sigCol - 1),
          topRight: getAt(sigRow - 1, sigCol + 1),
          bottomLeft: getAt(sigRow + 1, sigCol - 1),
          bottomRight: getAt(sigRow + 1, sigCol + 1),
        }
      : {
          top: null,
          bottom: null,
          left: null,
          right: null,
          topLeft: null,
          topRight: null,
          bottomLeft: null,
          bottomRight: null,
        };

  // 같은 열 (그리드 안 4장만).
  const sameCol: LenormandCard[] =
    sigPos < GRID_COLS * GRID_ROWS
      ? cards.filter(
          (_, i) => i < GRID_COLS * GRID_ROWS && i % GRID_COLS === sigCol,
        )
      : [];

  // 영혼 카드.
  const soulCards = cards.slice(GRID_COLS * GRID_ROWS, 36);

  return {
    significatorPos: sigPos,
    significatorCard: sigCard,
    pastCards,
    futureCards,
    surrounding,
    sameRow,
    sameCol,
    soulCards,
  };
}
