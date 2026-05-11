"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

const NAV_ACTIVE   = "#2b2138";
const NAV_MUTED    = "#706579";
const NAV_SURFACE  = "rgba(251,247,239,.9)";
const NAV_SURFACE2 = "rgba(251,247,239,.74)";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="하단 메뉴"
      className="sticky bottom-0 z-30 md:hidden"
      style={{
        background: `url("/nav/mobile_nav_bg.svg") left bottom / 100% 72px no-repeat,
                     linear-gradient(to top, ${NAV_SURFACE}, ${NAV_SURFACE2})`,
        borderRadius: "22px 22px 0 0",
        boxShadow: "0 -14px 34px rgba(43,33,56,.14)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
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

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-[56px] flex-1 shrink-0 flex-col items-center justify-center gap-[3px] min-h-[52px] px-1 transition-colors duration-150"
              style={{ color: isActive ? NAV_ACTIVE : NAV_MUTED }}
            >
              {/* 아이콘 컨테이너 */}
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: NAV_ACTIVE,
                        boxShadow: "0 5px 14px rgba(43,33,56,.24)",
                        color: "#ffffff",
                      }
                    : {}
                }
              >
                <NavIcon item={item} size={22} />
              </span>

              <span className="max-w-[52px] truncate text-center font-semibold leading-none"
                style={{ fontSize: 10 }}>
                {item.label}
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
