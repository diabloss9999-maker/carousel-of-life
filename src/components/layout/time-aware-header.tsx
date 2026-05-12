"use client";

interface TimeAwareHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TimeAwareHeader({ children, className, style }: TimeAwareHeaderProps) {
  return (
    <header
      className={className}
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--header-border)",
        boxShadow: "var(--header-shadow)",
        ...style,
      }}
    >
      {children}
    </header>
  );
}
