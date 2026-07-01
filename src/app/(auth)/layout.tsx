import Link from "next/link";

import { ROUTES } from "@/lib/constants";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-[12%] -z-10 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
      />

      <Link
        href={ROUTES.home}
        className="font-mystic mb-8 text-3xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
      >
        {siteConfig.name}
      </Link>

      <div className="w-full max-w-[390px]">{children}</div>
    </main>
  );
}
