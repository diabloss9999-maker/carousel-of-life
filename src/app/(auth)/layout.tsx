import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(155,109,225,0.12),transparent_60%)]"
      />

      <Link
        href={ROUTES.home}
        className="font-mystic mb-8 text-2xl font-semibold tracking-tight text-foreground hover:text-primary transition-colors"
      >
        {siteConfig.name}
      </Link>

      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
