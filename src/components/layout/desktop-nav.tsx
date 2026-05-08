"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * 데스크톱 상단 네비게이션 바 (md 이상에서만 표시).
 * 현재 경로에 따라 활성 항목에 강조 스타일을 적용한다.
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 rounded-full border border-border/55 bg-card/50 p-1 shadow-sm backdrop-blur md:flex"
      aria-label="상단 메뉴"
    >
      {mainNav
        .filter((item) => item.authOnly)
        .map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary shadow-inner"
                  : "text-muted-foreground hover:bg-primary/12 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
