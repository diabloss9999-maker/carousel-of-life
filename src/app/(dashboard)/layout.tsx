import Link from "next/link";

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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <Link
            href={ROUTES.today}
            className="font-mystic text-lg font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
          >
            {siteConfig.name}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {mainNav
              .filter((item) => item.href !== ROUTES.settings)
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm">
              로그아웃
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 md:py-12">
          {children}
        </div>
      </main>

      <nav className="sticky bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
