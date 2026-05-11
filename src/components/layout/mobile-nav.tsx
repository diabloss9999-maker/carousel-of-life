"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

/**
 * 모바일 하단 네비게이션 바.
 *
 * - 커스텀 SVG 아이콘 (iconSrc) 우선, 없으면 Lucide 폴백
 * - CSS mask-image 로 활성/비활성 색상 제어
 * - Safe Area Inset 대응, 터치 타깃 44px 이상 보장
 */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-30 border-t border-border/45 bg-background/90 backdrop-blur-xl md:hidden"
      aria-label="하단 메뉴"
    >
      <div
        className={cn(
          "flex items-stretch pb-safe",
          "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {mainNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-w-[56px] flex-1 flex-col items-center justify-center gap-[3px] shrink-0",
                "min-h-[52px] px-1 py-2 text-[10px] font-medium leading-none",
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
                <NavIcon item={item} size={22} />
              </span>
              <span className="max-w-[52px] truncate leading-none text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** 커스텀 SVG 아이콘 (mask-image) 또는 Lucide 폴백. */
function NavIcon({ item, size }: { item: NavItem; size: number }) {
  if (item.iconSrc) {
    return (
      <span
        aria-hidden
        style={{
          display: "block",
          width: size,
          height: size,
          backgroundColor: "currentColor",
          maskImage: `url(${item.iconSrc})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: `url(${item.iconSrc})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }
  const Icon = item.icon;
  return <Icon style={{ width: size, height: size }} aria-hidden />;
}
