import type { Metadata } from "next";

import { CompatibilityCard } from "@/components/compatibility/compatibility-card";
import { CompatibilityForm } from "@/components/compatibility/compatibility-form";
import { requireProfile } from "@/lib/auth/get-user";
import { getRecentCompatibility } from "@/lib/compatibility/service";

export const metadata: Metadata = {
  title: "궁합",
  description: "두 사람의 사주를 견주어 궁합을 살펴봐요.",
};

export default async function CompatibilityPage() {
  const { profile } = await requireProfile();
  const readings = await getRecentCompatibility(profile.userId, 5);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          두 운명의 만남
        </h1>
        <p className="text-sm text-muted-foreground">
          상대방의 정보를 알려주면 두 사주를 견주어 궁합을 살펴줄게.
        </p>
      </header>

      <CompatibilityForm />

      {readings.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-mystic text-xl font-semibold tracking-tight">
            지난 궁합
          </h2>
          <div className="space-y-4">
            {readings.map((r) => (
              <CompatibilityCard key={r.id} reading={r} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
