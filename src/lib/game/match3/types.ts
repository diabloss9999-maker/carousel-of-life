/**
 * match-3 엔진 타입.
 *
 * 보드는 [row][col] 2차원 배열이고, 각 칸은 Cell(또는 해소 중 임시 빈칸 null).
 * 엔진은 React 와 무관한 순수 데이터만 다루며, UI 애니메이션을 위해 한 수의 해소를
 * 단계(ResolveStep) 배열로 돌려준다.
 */
import type { CharacterId } from "@/lib/chat/characters";

/** 특수타일 종류. */
export type SpecialKind =
  | "none"
  | "rowClear" // 가로 한 줄 제거
  | "colClear" // 세로 한 줄 제거
  | "bomb" // 3x3 폭발
  | "rainbow"; // 같은 멤버 전체 제거(스왑 시 발동)

export interface Cell {
  /** 애니메이션 key 용 전역 유일 id. */
  id: number;
  /** 멤버 타일 종류. rainbow 특수타일은 null(모든 색과 매치되는 만능). */
  member: CharacterId | null;
  special: SpecialKind;
}

export type Board = (Cell | null)[][];

export interface Pos {
  r: number;
  c: number;
}

/** 한 수의 해소 중 한 단계(최초 매치 또는 연쇄 1회)의 애니메이션 기록. */
export interface ResolveStep {
  /** 이번 단계에서 사라지는 칸 좌표. */
  cleared: Pos[];
  /** 이번 단계에서 생성되는 특수타일. */
  created: { pos: Pos; special: SpecialKind; member: CharacterId | null }[];
  /** 이번 단계 획득 점수. */
  score: number;
  /** 연쇄 인덱스(0=첫 매치). 콤보 배수·연출 강도에 사용. */
  combo: number;
  /** 이번 단계 종료 후 정착된 보드(중력·리필 완료). UI 는 이걸 최종 상태로 렌더. */
  board: Board;
  /** 특수타일이 발동했는지(스크린 셰이크 등 강한 연출 트리거). */
  hadSpecial: boolean;
}

export interface ResolveResult {
  /** 유효한 수였는지(매치 발생 또는 특수 발동). false 면 스왑 무효(되돌림). */
  valid: boolean;
  steps: ResolveStep[];
  totalScore: number;
  board: Board;
  /** 최대 연쇄 수(콤보 보너스 표시). */
  maxCombo: number;
  /** 이번 수로 사라진 총 타일 수. */
  totalCleared: number;
}
