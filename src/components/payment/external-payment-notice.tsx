/**
 * Google Play 외부 결제 시스템 사용 안내.
 *
 * 한국 사용자 대상 앱이 토스/Lemon Squeezy 등 외부 결제를 사용할 때
 * Google Play 정책(25.3.2) 에 따라 결제 화면에 명시적으로 안내해야 한다.
 *
 * /pricing 및 결제 진입 직전 페이지에 노출.
 */
import { Info } from "lucide-react";

export function ExternalPaymentNotice() {
  return (
    <div className="app-surface rounded-2xl p-4 text-[15px]">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-1 text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground">결제 시스템 안내</p>
          <p>
            본 앱의 결제는 Google Play 결제가 아닌 외부 결제 시스템
            (토스페이먼츠·Lemon Squeezy) 을 통해 진행됩니다. 결제·환불 관련
            문의는 앱 내 고객 지원으로 연락해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
