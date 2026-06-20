export type Arcana = "major" | "minor";
export type Suit = "wands" | "cups" | "swords" | "pentacles";

export interface TarotCard {
  id: string;
  nameEn: string;
  nameKo: string;
  arcana: Arcana;
  suit: Suit | null;
  number: number;
}

const MAJOR: TarotCard[] = [
  { id: "the_fool", nameEn: "The Fool", nameKo: "바보", arcana: "major", suit: null, number: 0 },
  { id: "the_magician", nameEn: "The Magician", nameKo: "마법사", arcana: "major", suit: null, number: 1 },
  { id: "the_high_priestess", nameEn: "The High Priestess", nameKo: "여사제", arcana: "major", suit: null, number: 2 },
  { id: "the_empress", nameEn: "The Empress", nameKo: "여황제", arcana: "major", suit: null, number: 3 },
  { id: "the_emperor", nameEn: "The Emperor", nameKo: "황제", arcana: "major", suit: null, number: 4 },
  { id: "the_hierophant", nameEn: "The Hierophant", nameKo: "교황", arcana: "major", suit: null, number: 5 },
  { id: "the_lovers", nameEn: "The Lovers", nameKo: "연인", arcana: "major", suit: null, number: 6 },
  { id: "the_chariot", nameEn: "The Chariot", nameKo: "전차", arcana: "major", suit: null, number: 7 },
  { id: "strength", nameEn: "Strength", nameKo: "힘", arcana: "major", suit: null, number: 8 },
  { id: "the_hermit", nameEn: "The Hermit", nameKo: "은둔자", arcana: "major", suit: null, number: 9 },
  { id: "wheel_of_fortune", nameEn: "Wheel of Fortune", nameKo: "운명의 수레바퀴", arcana: "major", suit: null, number: 10 },
  { id: "justice", nameEn: "Justice", nameKo: "정의", arcana: "major", suit: null, number: 11 },
  { id: "the_hanged_man", nameEn: "The Hanged Man", nameKo: "매달린 사람", arcana: "major", suit: null, number: 12 },
  { id: "death", nameEn: "Death", nameKo: "죽음", arcana: "major", suit: null, number: 13 },
  { id: "temperance", nameEn: "Temperance", nameKo: "절제", arcana: "major", suit: null, number: 14 },
  { id: "the_devil", nameEn: "The Devil", nameKo: "악마", arcana: "major", suit: null, number: 15 },
  { id: "the_tower", nameEn: "The Tower", nameKo: "탑", arcana: "major", suit: null, number: 16 },
  { id: "the_star", nameEn: "The Star", nameKo: "별", arcana: "major", suit: null, number: 17 },
  { id: "the_moon", nameEn: "The Moon", nameKo: "달", arcana: "major", suit: null, number: 18 },
  { id: "the_sun", nameEn: "The Sun", nameKo: "태양", arcana: "major", suit: null, number: 19 },
  { id: "judgement", nameEn: "Judgement", nameKo: "심판", arcana: "major", suit: null, number: 20 },
  { id: "the_world", nameEn: "The World", nameKo: "세계", arcana: "major", suit: null, number: 21 },
];

const SUITS: { id: Suit; ko: string; en: string }[] = [
  { id: "wands", ko: "완드", en: "Wands" },
  { id: "cups", ko: "컵", en: "Cups" },
  { id: "swords", ko: "소드", en: "Swords" },
  { id: "pentacles", ko: "펜타클", en: "Pentacles" },
];

const COURT: { rank: number; idSuffix: string; en: string; ko: string }[] = [
  { rank: 11, idSuffix: "page", en: "Page", ko: "페이지" },
  { rank: 12, idSuffix: "knight", en: "Knight", ko: "나이트" },
  { rank: 13, idSuffix: "queen", en: "Queen", ko: "퀸" },
  { rank: 14, idSuffix: "king", en: "King", ko: "킹" },
];

const NUMBER_KO_NAME: Record<number, string> = {
  1: "에이스",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
};

const NUMBER_EN_NAME: Record<number, string> = {
  1: "Ace",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
};

function buildMinor(): TarotCard[] {
  const cards: TarotCard[] = [];
  for (const suit of SUITS) {
    for (let n = 1; n <= 10; n += 1) {
      cards.push({
        id: `${suit.id}_${n}`,
        nameEn: `${NUMBER_EN_NAME[n]} of ${suit.en}`,
        nameKo: `${suit.ko} ${NUMBER_KO_NAME[n]}`,
        arcana: "minor",
        suit: suit.id,
        number: n,
      });
    }
    for (const court of COURT) {
      cards.push({
        id: `${suit.id}_${court.idSuffix}`,
        nameEn: `${court.en} of ${suit.en}`,
        nameKo: `${suit.ko} ${court.ko}`,
        arcana: "minor",
        suit: suit.id,
        number: court.rank,
      });
    }
  }
  return cards;
}

export const TAROT_DECK: TarotCard[] = [...MAJOR, ...buildMinor()];

if (TAROT_DECK.length !== 78) {
  throw new Error(`타로 덱 카드 수 오류: 기대 78, 실제 ${TAROT_DECK.length}`);
}

export const TAROT_BY_ID: Record<string, TarotCard> = Object.fromEntries(
  TAROT_DECK.map((card) => [card.id, card]),
);

export function getTarotCard(id: string): TarotCard {
  const card = TAROT_BY_ID[id];
  if (!card) {
    throw new Error(`존재하지 않는 타로 카드 id: ${id}`);
  }
  return card;
}
