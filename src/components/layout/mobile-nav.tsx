"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * 모바일 하단 네비게이션 바.
 *
 * - 현재 경로에 따라 활성 상태 표시
 * - Safe Area Inset (iPhone 홈 인디케이터 / Galaxy 제스처 바) 대응
 * - 터치 타깃 44px 이상 보장
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-border/45 bg-background/85 backdrop-blur-xl md:hidden"
      aria-label="하단 메뉴"
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around pb-safe">
        {mainNav.map((item) => {
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
                "flex flex-1 flex-col items-center justify-center gap-[3px]",
                "min-h-[44px] px-1 py-2 text-[10px] font-medium leading-none",
                "transition-colors duration-150",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150",
                  isActive && "bg-primary/12 scale-105",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="truncate leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
