/**
 * 결제 시스템 준비 중 안내 배너.
 *
 * /pricing 페이지 상단에 노출. PG 가맹 심사 완료 + Channel Key 입력 전까지
 * 사용자에게 결제 일시 불가 안내.
 *
 * subscribe-cta.tsx 에서 자동 분기 — Channel Key 없으면 이 배너 + "준비 중" 버튼.
 */
import { Sparkles } from "lucide-react";

export function PaymentPendingNotice() {
  return (
    <div
      className="app-surface rounded-2xl p-5 ring-1 ring-accent/20"
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/15">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <div className="space-y-1.5">
          <p className="font-mystic text-lg font-semibold text-foreground">
            결제 시스템 준비 중이에요
          </p>
          <p className="text-[15px] text-foreground/80 leading-relaxed">
            정식 결제 오픈 전이에요. 곧 멤버십 가입이 열려요.
            준비되는 대로 가장 먼저 알려드릴게요.
          </p>
          <p className="text-[15px] text-muted-foreground leading-relaxed pt-1">
            궁금한 점은{" "}
            <a
              href="https://invite.kakao.com/tc/W5meqEedOZ"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              카카오 오픈채팅
            </a>{" "}
            으로 편하게 물어봐 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
