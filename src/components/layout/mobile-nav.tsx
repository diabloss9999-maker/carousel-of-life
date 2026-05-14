"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const NAV_ACTIVE   = "var(--nav-active)";
const NAV_MUTED    = "var(--nav-muted)";
const NAV_SURFACE  = "rgba(255,255,255,0.16)";
const NAV_SURFACE2 = "rgba(255,255,255,0.08)";

export function MobileNav() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tExtras = useTranslations("todayExtras");

  return (
    <nav
      aria-label={tExtras("navBottomAria")}
      className="sticky bottom-0 z-30 md:hidden"
      style={{
        background: `linear-gradient(to top, ${NAV_SURFACE}, ${NAV_SURFACE2})`,
        borderRadius: "20px 20px 0 0",
        borderTop: "1px solid var(--header-border)",
        boxShadow: "0 -8px 32px rgba(102,80,62,0.10)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 8,
      }}
    >
      <div
        className={cn(
          "flex items-stretch",
          "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {mainNav.map((item) => {
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
              className="flex min-w-[56px] flex-1 shrink-0 flex-col items-center justify-center gap-[3px] min-h-[52px] px-1 transition-colors duration-150"
              style={{ color: isActive ? NAV_ACTIVE : NAV_MUTED }}
            >
              {/* 아이콘 컨테이너 */}
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: "rgba(116,86,64,0.12)",
                        boxShadow: "0 0 18px rgba(185,143,75,0.18)",
                        color: "var(--nav-active)",
                      }
                    : {}
                }
              >
                <NavIcon item={item} size={22} />
              </span>

              <span className="max-w-[64px] truncate text-center font-semibold tracking-tight leading-none"
                style={{ fontSize: 10 }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
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
