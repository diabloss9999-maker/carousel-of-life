import Link from "next/link";
import { LogOut } from "lucide-react";

import { TimeAwareHeader } from "@/components/layout/time-aware-header";

import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/navigation";
import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { signOutAction } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/get-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <TimeAwareHeader className="sticky top-0 z-40 border-b border-black/10 shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            href={ROUTES.today}
            className="font-mystic whitespace-nowrap text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-75"
          >
            {siteConfig.name}
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border/55 bg-card/50 p-1 shadow-sm backdrop-blur md:flex">
            {mainNav
              .filter((item) => item.authOnly)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/12 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="rounded-full border border-border/55 bg-card/45 px-3 text-muted-foreground shadow-sm backdrop-blur hover:bg-card/70 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </form>
        </div>
      </TimeAwareHeader>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 md:py-10">
          {children}
        </div>
      </main>

      <nav className="sticky bottom-0 z-30 border-t border-border/45 bg-background/82 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
