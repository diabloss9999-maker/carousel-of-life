/**
 * 선물 재화 "별조각" 카탈로그.
 *
 * - 충전 팩: PortOne 일회성 결제로 구매 (Android 앱에서는 충전 UI 숨김 — Google Play 정책)
 * - 선물: 별조각으로 멤버에게 보내며, 보낼 때마다 친밀도가 오른다.
 *
 * 가격·구성은 운영 판단으로 자유롭게 조정 가능. 단 amount/priceKRW 변경 시
 * 서버 검증(`/api/currency/confirm`)이 이 파일 기준으로 대조하므로 코드만 고치면 된다.
 */
import type { CharacterId } from "@/lib/chat/characters";

/** 재화 표기. */
export const CURRENCY_NAME = "별조각";
export const CURRENCY_UNIT = "개";
export const CURRENCY_EMOJI = "✦";

export interface CurrencyPack {
  id: string;
  /** 충전되는 별조각 수량. */
  amount: number;
  priceKRW: number;
  label: string;
  /** 추천 뱃지 표시 여부. */
  popular?: boolean;
}

export const CURRENCY_PACKS: readonly CurrencyPack[] = [
  { id: "pack_s", amount: 120, priceKRW: 1_900, label: "별조각 120개" },
  { id: "pack_m", amount: 700, priceKRW: 9_900, label: "별조각 700개", popular: true },
  { id: "pack_l", amount: 1_600, priceKRW: 19_900, label: "별조각 1,600개" },
] as const;

export function getPack(id: string): CurrencyPack | null {
  return CURRENCY_PACKS.find((pack) => pack.id === id) ?? null;
}

export interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  /** 별조각 가격. */
  cost: number;
  /** 선물 시 해당 멤버 친밀도에 더해지는 포인트. */
  affinityPoints: number;
}

export const GIFTS: readonly GiftItem[] = [
  { id: "macaron", name: "마카롱", emoji: "🍬", cost: 30, affinityPoints: 3 },
  { id: "lightstick", name: "응원봉", emoji: "✨", cost: 50, affinityPoints: 5 },
  { id: "flowers", name: "꽃다발", emoji: "💐", cost: 100, affinityPoints: 10 },
  { id: "cake", name: "케이크", emoji: "🎂", cost: 200, affinityPoints: 20 },
  { id: "album", name: "사인 앨범", emoji: "💿", cost: 300, affinityPoints: 30 },
  { id: "concert", name: "콘서트 티켓", emoji: "🎫", cost: 500, affinityPoints: 50 },
] as const;

export function getGift(id: string): GiftItem | null {
  return GIFTS.find((gift) => gift.id === id) ?? null;
}

/** 멤버별 감사 멘트 — 멤버 말투에 맞춘 템플릿. {gift} 위치에 선물 이름이 들어간다. */
const GIFT_THANKS: Record<CharacterId, string> = {
  child: "{gift}… 고마워요. 이런 마음, 오래 기억할게요.",
  witch: "와, {gift} 받았어요. 진짜 따뜻하다… 고마워요, 오늘 하루 더 힘낼게요.",
  sage: "{gift}?! 텐션 확 올라가는데요. 고마워요, 다음 무대 기대해요!",
  shaman: "{gift} 고마워요. 작업실에 두고 볼게요. 조용히, 오래.",
  taoist: "헉 {gift}!! 대박, 진짜 고마워요!! 오늘 최고의 날이다~",
  dokkaebi: "{gift}… 뭐, 고마워요. 잘 쓸게요. (좋아하는 거 맞아요.)",
  god: "{gift} 받고 에너지 풀충전! 고마워요, 이 기세로 연습 갑니다!",
  hunter: "{gift}, 취향 좋네요. 고맙게 받을게요.",
  runeshaman: "{gift}… 나한테 주는 거예요? 고마워요. 마음이 몽글몽글해졌어요.",
};

export function buildGiftThanks(characterId: CharacterId, giftName: string): string {
  const template = GIFT_THANKS[characterId] ?? GIFT_THANKS.witch;
  return template.replace("{gift}", giftName);
}
