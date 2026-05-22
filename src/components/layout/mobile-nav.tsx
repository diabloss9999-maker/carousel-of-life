"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronUp } from "lucide-react";

import {
  mainNav,
  isGroupActive,
  isLeafActive,
  type NavGroup,
  type NavLeaf,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useLocationHash } from "@/hooks/use-location-hash";

const NAV_ACTIVE   = "var(--nav-active)";
const NAV_MUTED    = "var(--nav-muted)";
const NAV_SURFACE  = "rgba(255,255,255,0.16)";
const NAV_SURFACE2 = "rgba(255,255,255,0.08)";

export function MobileNav() {
  const pathname = usePathname();
  const params = useSearchParams();
  const tNav = useTranslations("nav");
  const tExtras = useTranslations("todayExtras");

  const hash = useLocationHash();
  const search = params.toString();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    setOpenGroup(null);
  }, [pathname, search, hash]);

  const activeGroup =
    openGroup
      ? (mainNav.find((e) => e.type === "group" && e.id === openGroup) as NavGroup | undefined)
      : undefined;

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
      {/* 그룹 시트는 body 직속으로 띄움 (헤더/푸터 backdrop-filter 회피) */}
      {activeGroup && (
        <ExpandedPanelPortal
          group={activeGroup}
          tileRef={tileRefs.current[activeGroup.id] ?? null}
          onClose={() => setOpenGroup(null)}
          tNav={tNav}
          pathname={pathname}
          search={search}
          hash={hash}
        />
      )}

      <div
        className={cn(
          "flex items-stretch",
          "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {mainNav.map((entry) => {
          if (entry.type === "leaf") {
            const active = isLeafActive(entry, pathname, search, hash);
            return (
              <NavTile
                key={entry.href as string}
                href={entry.href}
                label={tNav(entry.labelKey)}
                iconSrc={entry.iconSrc}
                isActive={active}
              />
            );
          }
          const active = isGroupActive(entry, pathname, search, hash);
          const isOpen = openGroup === entry.id;
          return (
            <NavGroupTile
              key={entry.id}
              groupId={entry.id}
              label={tNav(entry.labelKey)}
              iconSrc={entry.iconSrc}
              isActive={active}
              isOpen={isOpen}
              registerRef={(el) => {
                tileRefs.current[entry.id] = el;
              }}
              onToggle={() =>
                setOpenGroup((cur) => (cur === entry.id ? null : entry.id))
              }
            />
          );
        })}
      </div>
    </nav>
  );
}

/* ── Portal 시트 — body 직속, 진짜 backdrop-filter 작동 ────── */
function ExpandedPanelPortal({
  group,
  tileRef,
  onClose,
  tNav,
  pathname,
  search,
  hash,
}: {
  group: NavGroup;
  tileRef: HTMLButtonElement | null;
  onClose: () => void;
  tNav: (k: string) => string;
  pathname: string;
  search: string;
  hash: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const updatePosition = () => {
    if (!tileRef) return;
    const r = tileRef.getBoundingClientRect();
    setCoords({
      // 타일 위쪽으로 시트가 뜸 (8px 띄움).
      bottom: window.innerHeight - r.top + 8,
      left: r.left + r.width / 2,
      width: 200,
    });
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileRef]);

  if (!mounted || !coords) return null;

  return createPortal(
    <>
      {/* 백드롭 */}
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.30)",
          zIndex: 90,
        }}
      />
      <ul
        className="app-surface overflow-hidden rounded-2xl"
        style={{
          position: "fixed",
          bottom: coords.bottom,
          left: coords.left,
          transform: "translateX(-50%)",
          zIndex: 100,
          minWidth: coords.width,
          padding: "6px",
          // 인라인 backdrop-filter 도 같이 — Tailwind/Lightning CSS 빠짐 케이스 보정.
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
        }}
      >
        {group.children.map((child) => {
          const active = isLeafActive(child, pathname, search, hash);
          return (
            <li key={child.href as string}>
              <Link
                href={child.href}
                aria-current={active ? "page" : undefined}
                className="block rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors"
                style={
                  active
                    ? {
                        color: NAV_ACTIVE,
                        background: "rgba(255,255,255,0.10)",
                        fontWeight: 700,
                      }
                    : { color: NAV_MUTED }
                }
                onClick={(e) => handleLeafClick(e, child.href as string, onClose)}
              >
                {tNav(child.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </>,
    document.body,
  );
}

/* ── 단일 leaf 타일 ──────────────────────────────────────── */
function NavTile({
  href,
  label,
  iconSrc,
  isActive,
}: {
  href: NavLeaf["href"];
  label: string;
  iconSrc?: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="flex min-w-[56px] flex-1 shrink-0 flex-col items-center justify-center gap-[3px] min-h-[52px] px-1 transition-colors duration-150"
      style={{ color: isActive ? NAV_ACTIVE : NAV_MUTED }}
    >
      <IconBubble iconSrc={iconSrc} isActive={isActive} />
      <span
        className="max-w-[64px] truncate text-center font-semibold tracking-tight leading-none"
        style={{ fontSize: 10 }}
      >
        {label}
      </span>
    </Link>
  );
}

/* ── 그룹 타일 ──────────────────────────────────────────── */
function NavGroupTile({
  groupId,
  label,
  iconSrc,
  isActive,
  isOpen,
  onToggle,
  registerRef,
}: {
  groupId: string;
  label: string;
  iconSrc?: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  registerRef: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={registerRef}
      data-group={groupId}
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex min-w-[56px] flex-1 shrink-0 flex-col items-center justify-center gap-[3px] min-h-[52px] px-1 transition-colors duration-150"
      style={{ color: isActive || isOpen ? NAV_ACTIVE : NAV_MUTED }}
    >
      <IconBubble iconSrc={iconSrc} isActive={isActive || isOpen} />
      <span
        className="max-w-[64px] truncate text-center font-semibold tracking-tight leading-none flex items-center gap-0.5"
        style={{ fontSize: 10 }}
      >
        {label}
        <ChevronUp
          className="h-2.5 w-2.5 transition-transform"
          style={{ transform: isOpen ? "none" : "rotate(180deg)" }}
          aria-hidden
        />
      </span>
    </button>
  );
}

/* ── 해시 링크 핸들러 ──────────────────────────────────── */
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

function IconBubble({ iconSrc, isActive }: { iconSrc?: string; isActive: boolean }) {
  return (
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
      {iconSrc ? (
        <span
          aria-hidden
          style={{
            display: "block",
            width: 22,
            height: 22,
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
      ) : null}
    </span>
  );
}
