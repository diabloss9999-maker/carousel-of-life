"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import {
  mainNav,
  isGroupActive,
  isLeafActive,
  type NavGroup,
  type NavLeaf,
} from "@/config/navigation";

/** Light Ritual 네비 색상 */
const NAV_ACTIVE_BG  = "rgba(255,255,255,0.14)";
const NAV_ACTIVE_CLR = "var(--nav-active)";
const NAV_MUTED      = "var(--nav-muted)";

export function DesktopNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const tNav = useTranslations("nav");
  const tExtras = useTranslations("todayExtras");

  // 해시는 useSearchParams 로 추적 안 되니까 자체 상태로 관리.
  const [hash, setHash] = useState("");
  useEffect(() => {
    setHash(window.location.hash);
    const onHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const search = params.toString();

  return (
    <nav
      className="hidden items-center gap-0.5 md:flex"
      style={{
        padding: "6px",
        borderRadius: "999px",
        border: "1px solid var(--header-border)",
        background: "rgba(255,255,255,0.10)",
      }}
      aria-label={tExtras("navTopAria")}
    >
      {mainNav.map((entry) => {
        if (entry.type === "leaf") {
          return (
            <LeafLink
              key={entry.href as string}
              leaf={entry}
              isActive={isLeafActive(entry, pathname, search, hash)}
              label={tNav(entry.labelKey)}
            />
          );
        }
        return (
          <GroupDropdown
            key={entry.id}
            group={entry}
            isActive={isGroupActive(entry, pathname, search, hash)}
            label={tNav(entry.labelKey)}
            tNav={tNav}
            pathname={pathname}
            search={search}
            hash={hash}
          />
        );
      })}
    </nav>
  );
}

/* ── leaf ───────────────────────────────────────────────── */
function LeafLink({
  leaf,
  isActive,
  label,
}: {
  leaf: NavLeaf;
  isActive: boolean;
  label: string;
}) {
  return (
    <Link
      href={leaf.href}
      aria-current={isActive ? "page" : undefined}
      aria-label={`${label}${leaf.description ? ` — ${leaf.description}` : ""}`}
      title={leaf.description}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-semibold transition-all"
      style={
        isActive
          ? { background: NAV_ACTIVE_BG, color: NAV_ACTIVE_CLR, letterSpacing: "0.045em" }
          : { color: NAV_MUTED, letterSpacing: "0.04em" }
      }
    >
      <NavIcon iconSrc={leaf.iconSrc} Icon={leaf.icon} size={15} />
      {label}
    </Link>
  );
}

/* ── group dropdown (hover or click) ────────────────────── */
function GroupDropdown({
  group,
  isActive,
  label,
  tNav,
  pathname,
  search,
  hash,
}: {
  group: NavGroup;
  isActive: boolean;
  label: string;
  tNav: (k: string) => string;
  pathname: string;
  search: string;
  hash: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        // 포커스가 그룹 내부로 옮겨가면 닫지 않기.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-semibold transition-all"
        style={
          isActive
            ? { background: NAV_ACTIVE_BG, color: NAV_ACTIVE_CLR, letterSpacing: "0.045em" }
            : { color: NAV_MUTED, letterSpacing: "0.04em" }
        }
        onClick={() => setOpen((s) => !s)}
      >
        <NavIcon iconSrc={group.iconSrc} Icon={group.icon} size={15} />
        {label}
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-1.5 min-w-[160px] -translate-x-1/2 overflow-hidden rounded-2xl border shadow-xl"
          style={{
            background: "var(--surface, rgba(20,16,28,0.96))",
            borderColor: "var(--header-border)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          <ul className="py-1.5">
            {group.children.map((child) => {
              const active = isLeafActive(child, pathname, search, hash);
              return (
                <li key={child.href as string} role="none">
                  <Link
                    href={child.href}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    className="block px-4 py-2 text-[15px] font-medium transition-colors"
                    style={
                      active
                        ? { color: NAV_ACTIVE_CLR, background: "rgba(255,255,255,0.08)" }
                        : { color: NAV_MUTED }
                    }
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.color = NAV_ACTIVE_CLR;
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.color = NAV_MUTED;
                    }}
                  >
                    {tNav(child.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── icon ───────────────────────────────────────────────── */
function NavIcon({
  iconSrc,
  Icon,
  size,
}: {
  iconSrc?: string;
  Icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  size: number;
}) {
  if (iconSrc) {
    return (
      <span
        aria-hidden
        style={{
          display: "block",
          width: size,
          height: size,
          flexShrink: 0,
          backgroundColor: "currentColor",
          maskImage: `url(${iconSrc})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: `url(${iconSrc})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    );
  }
  if (Icon) return <Icon className="h-4 w-4 flex-shrink-0" aria-hidden />;
  return null;
}
