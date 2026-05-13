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
  Brain,
  Library,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface NavItem {
  href: Route;
  label: string;
  /** 호버 툴팁·aria-label 보조 텍스트로 노출되는 풀이. */
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
  { href: ROUTES.today,                label: "흐름",   description: "오늘의 기운이 어디로 흐르는가", icon: Home,          iconSrc: "/nav/nav_fortune.svg",     authOnly: true },
  { href: ROUTES.chat,                 label: "마주침", description: "오늘 당신에게 닿는 카드",       icon: MessageCircle, iconSrc: "/nav/nav_chat.svg",        authOnly: true },
  { href: ROUTES.tarot,                label: "속삭임", description: "별과 패가 일러주는 말",         icon: Sparkles,      iconSrc: "/nav/nav_tarot.svg",       authOnly: true },
  { href: ROUTES.saju,                 label: "타고남", description: "태어난 순간에 새겨진 결",       icon: Compass,       iconSrc: "/nav/nav_saju.svg",        authOnly: true },
  { href: ROUTES.compatibility,        label: "얽힘",   description: "사람과 사람 사이의 이어짐",     icon: Heart,         iconSrc: "/nav/nav_compat.svg",      authOnly: true },
  { href: ROUTES.personality as Route, label: "결",     description: "당신을 이루는 속의 무늬",       icon: Brain,         iconSrc: "/nav/nav_personality.svg", authOnly: true },
  { href: ROUTES.collection as Route,  label: "자취",   description: "지나온 날들의 자국",           icon: Library,       iconSrc: "/nav/nav_collection.svg",  authOnly: true },
  { href: ROUTES.settings,             label: "기록",   description: "오늘 남기는 말",               icon: Settings,      iconSrc: "/nav/nav_settings.svg",    authOnly: true },
];
