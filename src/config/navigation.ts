/**
 * 네비게이션 메뉴 정의.
 */
import type { Route } from "next";
import {
  Home,
  MessageCircle,
  Sparkles,
  Compass,
  Heart,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface NavItem {
  href: Route;
  /** i18n 메시지 키 — `nav.{key}` 로 번역 lookup. */
  labelKey: "fortune" | "oracle" | "tarot" | "pillars" | "bond" | "archive" | "settings";
  /** 호버 툴팁·aria-label 보조 텍스트로 노출되는 풀이 (한국어 톤). */
  description: string;
  icon: LucideIcon;
  /** public/nav/ 경로의 커스텀 SVG 아이콘 (있으면 Lucide 대신 사용). */
  iconSrc?: string;
  /** 비로그인 사용자에게도 노출할지 여부. */
  publicOnly?: boolean;
  /** 로그인 사용자에게만 노출할지 여부. */
  authOnly?: boolean;
}

export const mainNav: NavItem[] = [
  { href: ROUTES.today,                labelKey: "fortune",  description: "오늘의 운세 — 기운이 어디로 흐르는가", icon: Home,          iconSrc: "/nav/nav_fortune.svg",     authOnly: true },
  { href: ROUTES.chat,                 labelKey: "oracle",   description: "주술사와의 마주침",                     icon: MessageCircle, iconSrc: "/nav/nav_chat.svg",        authOnly: true },
  { href: ROUTES.tarot,                labelKey: "tarot",    description: "카드의 점술 — 별과 패가 일러주는 말",   icon: Sparkles,      iconSrc: "/nav/nav_tarot.svg",       authOnly: true },
  { href: ROUTES.saju,                 labelKey: "pillars",  description: "사주 — 태어난 순간에 새겨진 결",        icon: Compass,       iconSrc: "/nav/nav_saju.svg",        authOnly: true },
  { href: ROUTES.compatibility,        labelKey: "bond",     description: "궁합 — 사람과 사람 사이의 이어짐",      icon: Heart,         iconSrc: "/nav/nav_compat.svg",      authOnly: true },
  { href: ROUTES.collection as Route,  labelKey: "archive",  description: "도감 — 지나온 날들의 자국",             icon: Library,       iconSrc: "/nav/nav_collection.svg",  authOnly: true },
  { href: ROUTES.settings,             labelKey: "settings", description: "설정 — 오늘 남기는 말",                 icon: Settings,      iconSrc: "/nav/nav_settings.svg",    authOnly: true },
];
