/**
 * 네비게이션 메뉴 정의.
 *
 * 구조:
 *   - 그룹(group) : 헤더 하나 + 하위 leaf 들 (드롭다운으로 표시)
 *   - 잎(leaf)   : 단일 링크
 *
 * 데스크톱 = 호버 드롭다운 / 모바일 = 탭 시 확장.
 */
import type { Route } from "next";
import {
  Sparkles,
  Compass,
  MessageCircle,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  type: "leaf";
  href: Route;
  labelKey: string;
  /** i18n nav.* 키. */
  description?: string;
  icon?: LucideIcon;
  iconSrc?: string;
}

export interface NavGroup {
  type: "group";
  id: string;
  labelKey: string;
  icon?: LucideIcon;
  iconSrc?: string;
  /** 그룹 헤더를 어디로 보낼지 (탭 시) — children 첫 항목 권장. */
  defaultHref?: Route;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export const mainNav: NavEntry[] = [
  {
    type: "group",
    id: "fortune",
    labelKey: "fortuneGroup",
    iconSrc: "/nav/nav_fortune.svg",
    defaultHref: "/today" as Route,
    children: [
      { type: "leaf", href: "/today?category=general" as Route, labelKey: "fortuneGeneral" },
      { type: "leaf", href: "/today?category=love"    as Route, labelKey: "fortuneLove" },
      { type: "leaf", href: "/today?category=money"   as Route, labelKey: "fortuneMoney" },
      { type: "leaf", href: "/today?category=career"  as Route, labelKey: "fortuneCareer" },
      { type: "leaf", href: "/today?category=health"  as Route, labelKey: "fortuneHealth" },
      { type: "leaf", href: "/today?category=study"   as Route, labelKey: "fortuneStudy" },
    ],
  },
  {
    type: "group",
    id: "divination",
    labelKey: "divinationGroup",
    iconSrc: "/nav/nav_tarot.svg",
    icon: Sparkles,
    defaultHref: "/tarot" as Route,
    children: [
      { type: "leaf", href: "/tarot#tarot"            as Route, labelKey: "tarot" },
      { type: "leaf", href: "/tarot#lenormand"        as Route, labelKey: "lenormand" },
      { type: "leaf", href: "/tarot#runes"            as Route, labelKey: "runes" },
      { type: "leaf", href: "/today?category=zodiac"  as Route, labelKey: "zodiac" },
    ],
  },
  {
    type: "group",
    id: "east",
    labelKey: "eastGroup",
    iconSrc: "/nav/nav_saju.svg",
    icon: Compass,
    defaultHref: "/saju" as Route,
    children: [
      { type: "leaf", href: "/saju"                          as Route, labelKey: "saju" },
      { type: "leaf", href: "/palm"                          as Route, labelKey: "palm" },
      { type: "leaf", href: "/compatibility"                 as Route, labelKey: "compatibility" },
      { type: "leaf", href: "/personality"                   as Route, labelKey: "personality" },
      { type: "leaf", href: "/today?category=chinese_zodiac" as Route, labelKey: "chineseZodiac" },
    ],
  },
  {
    type: "leaf",
    href: "/chat" as Route,
    labelKey: "shaman",
    icon: MessageCircle,
    iconSrc: "/nav/nav_chat.svg",
    description: "점술사와의 마주침",
  },
  {
    type: "leaf",
    href: "/collection" as Route,
    labelKey: "archive",
    icon: Library,
    iconSrc: "/nav/nav_collection.svg",
    description: "도감 — 지나온 날들의 자국",
  },
  {
    type: "leaf",
    href: "/settings" as Route,
    labelKey: "settings",
    icon: Settings,
    iconSrc: "/nav/nav_settings.svg",
    description: "설정",
  },
];

/**
 * pathname + searchParams 가 주어진 NavLeaf 와 매치되는지.
 * - 쿼리(/today?category=love) 와 해시(/tarot#tarot) 도 매치.
 */
export function isLeafActive(
  leaf: NavLeaf,
  pathname: string,
  search: string,
  hash: string,
): boolean {
  const href = leaf.href as string;
  const [hrefPath, rest] = href.split(/[?#]/) as [string, string | undefined];
  if (pathname !== hrefPath) return false;

  if (href.includes("?")) {
    // 쿼리 매칭 — category=love 비교
    const qs = new URLSearchParams(search);
    const expected = new URLSearchParams(href.split("?")[1]);
    for (const [k, v] of expected) {
      if (qs.get(k) !== v) return false;
    }
    return true;
  }
  if (href.includes("#")) {
    const expectedHash = rest ?? "";
    const actual = (hash || "").replace(/^#/, "");
    // 해시가 없으면 첫 번째 항목(tarot)이 기본 활성으로 간주.
    if (actual === "") return expectedHash === "tarot";
    return actual === expectedHash;
  }
  return true;
}

/** 그룹의 자식 중 하나라도 활성이면 그룹도 활성. */
export function isGroupActive(
  group: NavGroup,
  pathname: string,
  search: string,
  hash: string,
): boolean {
  return group.children.some((c) => isLeafActive(c, pathname, search, hash));
}
