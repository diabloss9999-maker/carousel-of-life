import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="font-mystic text-7xl font-semibold tracking-tight text-primary">
          404
        </p>
        <h1 className="font-mystic text-2xl font-semibold tracking-tight">
          이 길은 운명에 적혀있지 않아요
        </h1>
        <p className="text-sm text-muted-foreground">
          찾으시는 자리가 여기엔 없어요. 처음으로 돌아가서 다시 길을 찾아봐요.
        </p>
        <Button asChild size="lg">
          <Link href={ROUTES.home}>처음으로</Link>
        </Button>
      </div>
    </main>
  );
}
