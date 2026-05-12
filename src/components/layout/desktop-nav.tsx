"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav, type NavItem } from "@/config/navigation";

/** ritual 다크 글래스 네비 색상 */
const NAV_ACTIVE_BG  = "rgba(233,221,190,0.10)";
const NAV_ACTIVE_CLR = "rgba(246,239,220,0.96)";
const NAV_MUTED      = "rgba(246,239,220,0.78)";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-0.5 md:flex"
      style={{
        padding: "6px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(255,255,255,0.10)",
      }}
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
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all"
              style={
                isActive
                  ? {
                      background: NAV_ACTIVE_BG,
                      color: NAV_ACTIVE_CLR,
                      letterSpacing: "0.045em",
                    }
                  : {
                      color: NAV_MUTED,
                      letterSpacing: "0.04em",
                    }
              }
            >
              <NavIcon item={item} size={15} />
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
