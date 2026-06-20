import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderCardProps {
  title: string;
  description: string;
  step?: string;
}

export function PlaceholderCard({
  title,
  description,
  step = "다음 단계",
}: PlaceholderCardProps) {
  return (
    <Card className="app-surface">
      <CardHeader>
        <CardTitle className="font-mystic flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mystic leading-relaxed text-muted-foreground">
          여기에 곧 운명의 풀이가 깃들 거예요. (개발 단계: {step})
        </p>
      </CardContent>
    </Card>
  );
}
