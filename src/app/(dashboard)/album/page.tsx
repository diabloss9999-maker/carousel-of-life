import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AlbumPlayer } from "@/components/album/album-player";
import {
  ALBUM_GROUP,
  ALBUM_GROUP_KO,
  ALBUM_RELEASE_DATE,
  ALBUM_TITLE,
  ALBUM_TITLE_EN,
  ALBUM_TRACKS,
} from "@/lib/album/album";

export const metadata: Metadata = {
  title: `${ALBUM_GROUP_KO} 1집`,
  description: `${ALBUM_GROUP} 1집 정규 앨범 "${ALBUM_TITLE}" - 9명이 부른 ${ALBUM_TRACKS.length}곡.`,
};

export default async function AlbumPage() {
  const t = await getTranslations("albumPage");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {ALBUM_GROUP} · 1ST ALBUM
        </p>
        <h1 className="font-mystic text-3xl font-semibold tracking-tight sm:text-4xl">
          {ALBUM_TITLE}
        </h1>
        <p className="text-[15px] text-muted-foreground">
          {t("subtitle", { titleEn: ALBUM_TITLE_EN, group: ALBUM_GROUP_KO })}
        </p>
        <p className="text-[13px] font-medium text-muted-foreground/80">
          {t("releaseDate", { date: ALBUM_RELEASE_DATE })}
        </p>
      </header>

      <AlbumPlayer />

      <p className="text-center text-[12px] text-muted-foreground/70">
        © {ALBUM_GROUP} · {ALBUM_TITLE}
      </p>
    </div>
  );
}
