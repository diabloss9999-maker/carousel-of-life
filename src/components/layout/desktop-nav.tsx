"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

/* ── group dropdown — Portal 로 body 직속 렌더 ───────────── */
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 포털 마운트 가드 (SSR).
  useEffect(() => setMounted(true), []);

  // 버튼 위치 계산 — 드롭다운을 버튼 아래 가운데에 띄우기.
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setCoords({
      top: r.bottom + 6,
      left: r.left + r.width / 2,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  // 바깥 클릭 / ESC 닫기.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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

      {mounted && open && coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="overflow-hidden rounded-2xl"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateX(-50%)",
              zIndex: 100,
              minWidth: 160,
              // 헤더의 backdrop-filter 안 탔으니까 진짜로 페이지 본문을 blur 함.
              background: "rgba(20, 16, 28, 0.45)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 40px rgba(0,0,0,0.45)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              color: "rgba(255,255,255,0.92)",
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
                          ? {
                              color: "rgba(255,255,255,1)",
                              background: "rgba(255,255,255,0.12)",
                              fontWeight: 700,
                            }
                          : { color: "rgba(255,255,255,0.82)" }
                      }
                      onClick={(e) =>
                        handleLeafClick(e, child.href as string, () => setOpen(false))
                      }
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.color = "rgba(255,255,255,1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "rgba(255,255,255,0.82)";
                        }
                      }}
                    >
                      {tNav(child.labelKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ── 해시 링크 클릭 핸들러 ──────────────────────────────────
 * Next.js Link 가 같은 경로 + 다른 해시(/tarot#lenormand) 로
 * 이동할 때 hashchange 이벤트를 안정적으로 발사 못 시킴.
 * 같은 경로이면 preventDefault 하고 window.location.hash 를 직접
 * 세팅 — 브라우저가 native hashchange 이벤트를 트리거.
 */
function handleLeafClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  href: string,
  closeMenu: () => void,
) {
  closeMenu();
  if (!href.includes("#")) return;
  if (typeof window === "undefined") return;
  const [path, h] = href.split("#");
  if (window.location.pathname !== path) return;
  e.preventDefault();
  if (window.location.hash !== `#${h}`) {
    window.location.hash = h;
  }
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
