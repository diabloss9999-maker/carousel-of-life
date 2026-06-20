import type { Route } from "next";
import {
  CalendarDays,
  Disc3,
  Library,
  MessageCircle,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface NavLeaf {
  type: "leaf";
  href: Route;
  labelKey: string;
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
  defaultHref?: Route;
  children: NavLeaf[];
  sections?: NavSection[];
}

export interface NavSection {
  id: string;
  labelKey: string;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

const fortuneChildren: NavLeaf[] = [
  { type: "leaf", href: "/today?category=general" as Route, labelKey: "fortuneGeneral" },
  { type: "leaf", href: "/today?category=love" as Route, labelKey: "fortuneLove" },
  { type: "leaf", href: "/today?category=money" as Route, labelKey: "fortuneMoney" },
  { type: "leaf", href: "/today?category=career" as Route, labelKey: "fortuneCareer" },
  { type: "leaf", href: "/today?category=health" as Route, labelKey: "fortuneHealth" },
  { type: "leaf", href: "/today?category=study" as Route, labelKey: "fortuneStudy" },
];

const divinationChildren: NavLeaf[] = [
  { type: "leaf", href: "/tarot#tarot" as Route, labelKey: "tarot" },
  { type: "leaf", href: "/flower-oracle" as Route, labelKey: "flowerOracle" },
  { type: "leaf", href: "/today?category=zodiac" as Route, labelKey: "zodiac" },
  { type: "leaf", href: "/today?category=chinese_zodiac" as Route, labelKey: "chineseZodiac" },
  { type: "leaf", href: "/personality" as Route, labelKey: "personality" },
  { type: "leaf", href: "/name-reading" as Route, labelKey: "nameReading" },
  { type: "leaf", href: "/name-compatibility" as Route, labelKey: "nameCompatibility" },
];

const sajuChildren: NavLeaf[] = [
  { type: "leaf", href: "/saju" as Route, labelKey: "saju" },
  { type: "leaf", href: "/palm" as Route, labelKey: "palm" },
  { type: "leaf", href: "/compatibility" as Route, labelKey: "compatibility" },
  { type: "leaf", href: "/dream" as Route, labelKey: "dream" },
];

const deepReportChildren: NavLeaf[] = [
  {
    type: "leaf",
    href: "/monthly" as Route,
    labelKey: "monthlyReport",
    icon: CalendarDays,
  },
  {
    type: "leaf",
    href: "/yearly" as Route,
    labelKey: "yearlyReport",
    icon: Sparkles,
  },
];

const recordChildren: NavLeaf[] = [
  {
    type: "leaf",
    href: "/archive" as Route,
    labelKey: "records",
    icon: Library,
  },
];

export const mainNav: NavEntry[] = [
  {
    type: "group",
    id: "fortune-suite",
    labelKey: "fortuneSuiteGroup",
    iconSrc: "/nav/nav_fortune.svg",
    defaultHref: "/today" as Route,
    children: [
      ...fortuneChildren,
      ...divinationChildren,
      ...sajuChildren,
      ...deepReportChildren,
      ...recordChildren,
    ],
    sections: [
      { id: "fortune", labelKey: "fortuneGroup", children: fortuneChildren },
      { id: "divination", labelKey: "divinationGroup", children: divinationChildren },
      { id: "east", labelKey: "eastGroup", children: sajuChildren },
      { id: "deep-reports", labelKey: "deepReportsGroup", children: deepReportChildren },
      { id: "records", labelKey: "records", children: recordChildren },
    ],
  },
  {
    type: "leaf",
    href: "/chat" as Route,
    labelKey: "shaman",
    icon: MessageCircle,
    iconSrc: "/nav/nav_chat.svg",
    description: "멤버 대화",
  },
  {
    type: "leaf",
    href: "/album" as Route,
    labelKey: "album",
    icon: Disc3,
    iconSrc: "/nav/nav_album.svg",
    description: "Carousel Nine 앨범",
  },
  {
    type: "leaf",
    href: "/collection" as Route,
    labelKey: "archive",
    icon: Library,
    iconSrc: "/nav/nav_collection.svg",
    description: "컬렉션",
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
    const qs = new URLSearchParams(search);
    const expected = new URLSearchParams(href.split("?")[1]);
    for (const [key, value] of expected) {
      if (qs.get(key) !== value) return false;
    }
    return true;
  }

  if (href.includes("#")) {
    const expectedHash = rest ?? "";
    const actualHash = (hash || "").replace(/^#/, "");
    if (actualHash === "") return expectedHash === "tarot";
    return actualHash === expectedHash;
  }

  return true;
}

export function isGroupActive(
  group: NavGroup,
  pathname: string,
  search: string,
  hash: string,
): boolean {
  return group.children.some((child) =>
    isLeafActive(child, pathname, search, hash),
  );
}
