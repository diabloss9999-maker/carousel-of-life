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
  icon: LucideIcon;
  /** public/nav/ 경로의 커스텀 SVG 아이콘 (있으면 Lucide 대신 사용). */
  iconSrc?: string;
  /** 비로그인 사용자에게도 노출할지 여부. */
  publicOnly?: boolean;
  /** 로그인 사용자에게만 노출할지 여부. */
  authOnly?: boolean;
}

export const mainNav: NavItem[] = [
  { href: ROUTES.today,                   label: "운세",   icon: Home,          iconSrc: "/nav/nav_fortune.svg",     authOnly: true },
  { href: ROUTES.chat,                    label: "주술사", icon: MessageCircle, iconSrc: "/nav/nav_chat.svg",        authOnly: true },
  { href: ROUTES.tarot,                   label: "타로",   icon: Sparkles,      iconSrc: "/nav/nav_tarot.svg",       authOnly: true },
  { href: ROUTES.saju,                    label: "사주",   icon: Compass,       iconSrc: "/nav/nav_saju.svg",        authOnly: true },
  { href: ROUTES.compatibility,           label: "궁합",   icon: Heart,         iconSrc: "/nav/nav_compat.svg",      authOnly: true },
  { href: ROUTES.personality as Route,    label: "유형",   icon: Brain,         iconSrc: "/nav/nav_personality.svg", authOnly: true },
  { href: ROUTES.collection as Route,     label: "컬렉션", icon: Library,       iconSrc: "/nav/nav_collection.svg",  authOnly: true },
  { href: ROUTES.settings,                label: "설정",   icon: Settings,      iconSrc: "/nav/nav_settings.svg",    authOnly: true },
];
