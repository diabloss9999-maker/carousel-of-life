"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import { useLocationHash } from "@/hooks/use-location-hash";

/** Light Ritual 네비 색상 */
const NAV_ACTIVE_BG  = "rgba(255,255,255,0.72)";
const NAV_ACTIVE_CLR = "var(--nav-active)";
const NAV_MUTED      = "var(--nav-muted)";

function subscribeToClientHydration(): () => void {
  return () => undefined;
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function useClientHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToClientHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const tNav = useTranslations("nav");
  const tExtras = useTranslations("todayExtras");

  // useSyncExternalStore 기반 — setState-in-effect 안티패턴 회피.
  const hash = useLocationHash();
  const search = params.toString();

  return (
    <nav
      className="hidden items-center gap-0.5 md:flex"
      style={{
        padding: "6px",
        borderRadius: "999px",
        border: "1px solid var(--header-border)",
        background: "rgba(255,255,255,0.54)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.62)",
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
  const mounted = useClientHydrated();
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    let frame = 0;
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const r = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: r.bottom + 6,
        left: r.left + r.width / 2,
      });
    };
    const schedulePosition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updatePosition);
    };
    schedulePosition();
    window.addEventListener("scroll", schedulePosition, true);
    window.addEventListener("resize", schedulePosition);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedulePosition, true);
      window.removeEventListener("resize", schedulePosition);
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
            className="app-surface overflow-hidden rounded-2xl"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateX(-50%)",
              zIndex: 100,
              width: group.sections ? "min(720px, calc(100vw - 24px))" : 160,
              minWidth: group.sections ? 360 : 160,
              // Portal 로 body 직속이라 헤더 backdrop-filter 영향 X
              // → .app-surface 의 backdrop-filter 가 진짜로 페이지를 blur.
              // 일부 환경에서 클래스 backdrop-filter 가 누락될 수 있으니 인라인도 추가.
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
            }}
          >
            {group.sections ? (
              <div className="space-y-1.5 p-2">
                {group.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2 rounded-xl px-2 py-2"
                    style={
                      index > 0
                        ? { borderTop: "1px solid rgba(0,0,0,0.14)" }
                        : undefined
                    }
                  >
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: NAV_ACTIVE_CLR }}
                    >
                      {tNav(section.labelKey)}
                    </p>
                    <div className="flex min-w-0 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {section.children.map((child) => (
                        <GroupMenuLink
                          key={child.href as string}
                          child={child}
                          active={isLeafActive(child, pathname, search, hash)}
                          label={tNav(child.labelKey)}
                          closeMenu={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="py-1.5">
                {group.children.map((child) => (
                  <li key={child.href as string} role="none">
                    <GroupMenuLink
                      child={child}
                      active={isLeafActive(child, pathname, search, hash)}
                      label={tNav(child.labelKey)}
                      closeMenu={() => setOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}

function GroupMenuLink({
  child,
  active,
  label,
  closeMenu,
}: {
  child: NavLeaf;
  active: boolean;
  label: string;
  closeMenu: () => void;
}) {
  return (
    <Link
      href={child.href}
      role="menuitem"
      aria-current={active ? "page" : undefined}
      className="block whitespace-nowrap rounded-lg px-3 py-2 text-[15px] font-medium transition-colors"
      style={
        active
          ? {
              color: NAV_ACTIVE_CLR,
              background: "rgba(255,255,255,0.10)",
              fontWeight: 700,
            }
          : { color: NAV_MUTED }
      }
      onClick={(e) => handleLeafClick(e, child.href as string, closeMenu)}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = NAV_ACTIVE_CLR;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = NAV_MUTED;
        }
      }}
    >
      {label}
    </Link>
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
