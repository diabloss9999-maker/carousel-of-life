"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const NAV_ACTIVE = "#2b2138";
const NAV_MUTED  = "#706579";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 md:flex"
      aria-label="상단 메뉴"
    >
      {mainNav
        .filter((item) => item.authOnly)
        .map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
              )}
              style={
                isActive
                  ? {
                      background: NAV_ACTIVE,
                      color: "#ffffff",
                      boxShadow: "0 6px 16px rgba(43,33,56,.18)",
                    }
                  : { color: NAV_MUTED }
              }
            >
              <NavIcon item={item} size={16} />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

function NavIcon({ item, size }: { item: NavItem; size: number }) {
  if (item.iconSrc) {
    return (
      <span
        aria-hidden
        style={{
          display: "block",
          width: size,
          height: size,
          flexShrink: 0,
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
  return <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />;
}
