import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function GlobalLoading() {
  const t = await getTranslations("appShell");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="font-mystic text-sm">{t("loadingText")}</p>
      </div>
    </div>
  );
}
