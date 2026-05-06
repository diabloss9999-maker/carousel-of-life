"use client";

/**
 * next-themes 기반 테마 프로바이더.
 *
 * 진지한 주술사 컨셉상 다크모드를 기본으로 한다.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
