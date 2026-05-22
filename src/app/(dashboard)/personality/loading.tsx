import { Loader2 } from "lucide-react";

export default function PersonalityLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        <p className="font-mystic text-[15px]">성격의 결을 읽는 중…</p>
      </div>
    </div>
  );
}
