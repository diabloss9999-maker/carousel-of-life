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
  Archive,
  Brain,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

export interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
  /** 비로그인 사용자에게도 노출할지 여부. */
  publicOnly?: boolean;
  /** 로그인 사용자에게만 노출할지 여부. */
  authOnly?: boolean;
}

export const mainNav: NavItem[] = [
  { href: ROUTES.today, label: "운세", icon: Home, authOnly: true },
  { href: ROUTES.chat, label: "주술사", icon: MessageCircle, authOnly: true },
  { href: ROUTES.tarot, label: "타로", icon: Sparkles, authOnly: true },
  { href: ROUTES.saju, label: "사주", icon: Compass, authOnly: true },
  { href: ROUTES.compatibility, label: "궁합", icon: Heart, authOnly: true },
  { href: ROUTES.personality as Route, label: "유형", icon: Brain, authOnly: true },
  { href: ROUTES.settings, label: "설정", icon: Settings, authOnly: true },
  { href: ROUTES.history as Route, label: "기록", icon: Archive, authOnly: true },
];
