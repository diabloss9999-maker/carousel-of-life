import { CharacterImage } from "@/components/shared/character-image";
import {
  Brain,
  Briefcase,
  Heart,
  HeartPulse,
  Map,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SajuDeepReading } from "@/lib/saju/deep-reading";
import { CHARACTERS } from "@/lib/chat/characters";
import { getTodayCharacter } from "@/lib/daily-question/rotation";

interface DeepReadingCardProps {
  reading: SajuDeepReading;
}

const SECTIONS: Array<{
  key: keyof Omit<SajuDeepReading, "model" | "createdAt">;
  title: string;
  desc: string;
  icon: LucideIcon;
  tone: string;
}> = [
  {
    key: "personality",
    title: "성격",
    desc: "타고난 결",
    icon: Brain,
    tone: "text-primary",
  },
  {
    key: "strengths",
    title: "강점",
    desc: "빛이 나는 자리",
    icon: TrendingUp,
    tone: "text-accent",
  },
  {
    key: "cautions",
    title: "조심할 점",
    desc: "기운이 약한 부분",
    icon: Sparkles,
    tone: "text-destructive",
  },
  {
    key: "loveStyle",
    title: "사랑",
    desc: "연애 스타일",
    icon: Heart,
    tone: "text-primary",
  },
  {
    key: "careerFit",
    title: "일",
    desc: "잘 풀리는 분야",
    icon: Briefcase,
    tone: "text-accent",
  },
  {
    key: "healthCare",
    title: "건강",
    desc: "관리 포인트",
    icon: HeartPulse,
    tone: "text-primary",
  },
  {
    key: "lifeFlow",
    title: "인생 흐름",
    desc: "큰 그림",
    icon: Map,
    tone: "text-accent",
  },
];

export function DeepReadingCard({ reading }: DeepReadingCardProps) {
  const charId = getTodayCharacter();
  const character = CHARACTERS[charId];

  return (
    <div className="space-y-4">
      <Card className="app-surface ring-1 ring-accent/15">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden />
              <CardTitle className="font-mystic text-xl">심층 분석</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-md flex-shrink-0">
                <CharacterImage character={character} fill className="object-cover object-top" sizes="56px" quality={90} />
              </div>
              <div>
                <p className="font-mystic text-sm font-semibold text-foreground">{character.name}</p>
                <p className="text-xs text-muted-foreground">{character.title}</p>
              </div>
            </div>
          </div>
          <CardDescription>
            한 번 적힌 풀이는 평생 곁에 있어. 마음에 담아두고 가끔 다시 펼쳐봐.
          </CardDescription>
        </CardHeader>
      </Card>

      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <Card
            key={s.key}
            className="app-surface"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-mystic flex items-center gap-2 text-lg">
                <Icon className={`h-5 w-5 ${s.tone}`} aria-hidden />
                {s.title}
                <span className="text-xs text-muted-foreground/70 font-normal">
                  {s.desc}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mystic whitespace-pre-line leading-relaxed text-foreground/90">
                {reading[s.key]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
