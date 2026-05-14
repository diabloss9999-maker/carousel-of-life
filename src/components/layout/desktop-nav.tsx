"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { mainNav, type NavItem } from "@/config/navigation";

/** Light Ritual 네비 색상 */
const NAV_ACTIVE_BG  = "rgba(255,255,255,0.14)";
const NAV_ACTIVE_CLR = "var(--nav-active)";
const NAV_MUTED      = "var(--nav-muted)";

export function DesktopNav() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  return (
    <nav
      className="hidden items-center gap-0.5 md:flex"
      style={{
        padding: "6px",
        borderRadius: "999px",
        border: "1px solid var(--header-border)",
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

          const label = tNav(item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={`${label} — ${item.description}`}
              title={item.description}
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
              {label}
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
