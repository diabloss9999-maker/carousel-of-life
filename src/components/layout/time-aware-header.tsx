"use client";

/**
 * KST 시간에 따라 헤더 배경을 전환하는 래퍼.
 */

import { useHeaderBg } from "./time-aware-bg";

interface TimeAwareHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TimeAwareHeader({ children, className, style }: TimeAwareHeaderProps) {
  const headerBg = useHeaderBg();

  return (
    <header
      className={className}
      style={{
        backgroundImage: `url(${headerBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    >
      {children}
    </header>
  );
}
