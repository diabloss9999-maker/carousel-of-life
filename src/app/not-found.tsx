import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default async function NotFound() {
  const t = await getTranslations("appShell");
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mystic text-7xl font-semibold tracking-tight text-primary">
          404
        </p>
        <h1 className="font-mystic text-2xl font-semibold tracking-tight">
          {t("notFoundTitle")}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("notFoundBody")}
        </p>
        <Button asChild size="lg">
          <Link href={ROUTES.home}>{t("notFoundHome")}</Link>
        </Button>
      </div>
    </main>
  );
}
