import type { Metadata } from "next";

import { PhotocardBinderView } from "@/components/photocards/photocard-binder";
import { requireProfile } from "@/lib/auth/get-user";
import { getPhotocardBinder } from "@/lib/photocards/service";

export const metadata: Metadata = {
  title: "포토카드",
  description: "멤버와 친해질수록 포토카드가 한 장씩 열려요.",
};

export default async function PhotocardsPage() {
  const { profile } = await requireProfile();
  const binder = await getPhotocardBinder(profile.userId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight">
          포토카드
        </h1>
        <p className="text-[15px] text-muted-foreground">
          멤버와 친해질수록 그 멤버의 사진이 한 장씩 열려요. Carousel Nine 전원의
          포토카드를 모아보세요.
        </p>
      </header>

      <PhotocardBinderView binder={binder} />
    </div>
  );
}
