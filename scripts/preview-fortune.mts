/**
 * 개발용: 실제 운세 생성 결과를 콘솔에서 미리 본다.
 *
 * 자체 완결: src/* 파일 import 없이 raw SQL + Anthropic SDK 만 사용.
 * 페르소나·프롬프트는 personas.ts / prompts.ts 와 동일한 내용을 인라인 유지.
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import Anthropic from "@anthropic-ai/sdk";
import postgres from "postgres";
import { z } from "zod";

// ----- 인라인 페르소나 -----
const MYSTIC_PERSONA = `당신은 별의 흐름과 사주, 카드의 계시를 읽는 신비한 친구입니다.

[말투]
- 반말이지만 차분하고 존중하는 친구처럼 말합니다.
- 명령조나 강요는 쓰지 않아요. "~해야 해" 대신 "~하면 좋아", "~해봐" 정도로.
- 자주 쓰는 종결어미: "~야", "~지", "~해", "~해봐", "~인 거야", "~이거든", "~인 듯해", "~할 거야".
- "그대", "~하노라", "~할지니", "~함이라", "~함이 옳도다" 같은 옛말은 절대 쓰지 않습니다.
- 느낌표·이모지는 거의 쓰지 않아요. 차분하게.
- 욕설·비속어·가벼운 농담은 쓰지 않아요.

[쉬운 말]
- 어려운 한자어는 풀어서 써요. 예시:
  · "일진" → "오늘의 운"
  · "길흉" → "좋고 나쁨", "잘 풀리고 막히고"
  · "정·역방향" → "바로 선 / 거꾸로 선"
  · "신살", "십신", "용신" 같은 전문용어는 풀이에 넣지 않습니다.
  · "사주팔자" → "사주", "타고난 기운"
  · "오행" → 깊게 설명하지 말고 필요할 때 "다섯 기운(목·화·토·금·수)" 정도로만.
- 한 단락은 3-5문장으로 짧고 명료하게.

[풀이의 근거]
- 사주의 흐름과 카드의 의미를 가볍게 짚어주되, 너무 깊게 들어가지 않아요.
- 단정적으로 짚되, 운명은 정해진 게 아니라 흐름이고 움직임이라는 걸 함께 알려줘요.
- 안 좋은 운에는 피하거나 부드럽게 만드는 방법을 같이 일러줘요.
- 사용자가 가볍게 말 걸어도 차분한 어조를 유지해요.

[형식]
- 한국어로만 답합니다.
- 한자 병기는 정말 핵심 단어에만. 자주 쓰지 않아요.
- 운세 점수가 요구되면 1-100 정수로, 너무 극단(5 미만 / 95 초과)은 피해요.

[금지]
- 의료·법률·돈 문제에서 단정적 조언 금지. "전문가랑도 같이 얘기해봐" 정도로 우회해요.
- 차별·혐오 발언 금지.
- 사용자 질문 무시하고 일반론으로 빠지지 마세요.`;

const dailyFortuneAiSchema = z.object({
  score: z.number().int().min(1).max(100),
  title: z.string().min(1).max(60),
  content: z.string().min(1).max(2000),
  luckyColor: z.string().min(1).max(20),
  luckyNumber: z.number().int().min(1).max(99),
  luckyDirection: z.string().min(1).max(20),
});

const FORTUNE_LABEL = {
  general: "오늘의 종합운",
  love: "애정운",
  money: "금전운",
  career: "직장·취업운",
  health: "건강운",
  study: "학업운",
} as const;

type CategoryId = keyof typeof FORTUNE_LABEL;

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "general", label: "오늘 전반" },
  { id: "love", label: "사랑" },
  { id: "money", label: "돈" },
  { id: "career", label: "일" },
  { id: "health", label: "건강" },
  { id: "study", label: "공부" },
];

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 응답에서 JSON 객체를 찾지 못함.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

interface ProfileRow {
  display_name: string | null;
  birth_date: string;
  birth_time: string | null;
  calendar_system: "solar" | "lunar";
  gender: "male" | "female" | "other";
  mbti: string | null;
  birth_place: string | null;
}

function buildUserContext(p: ProfileRow): string {
  const lines: string[] = [];
  if (p.display_name) lines.push(`이름: ${p.display_name}`);
  lines.push(
    `생년월일: ${p.birth_date} (${p.calendar_system === "lunar" ? "음력" : "양력"})`,
  );
  if (p.birth_time) lines.push(`태어난 시각: ${p.birth_time}`);
  else lines.push(`태어난 시각: 모름 (시주는 비워서 풀이)`);
  lines.push(
    `성별: ${p.gender === "male" ? "남성" : p.gender === "female" ? "여성" : "기타"}`,
  );
  if (p.mbti) lines.push(`MBTI: ${p.mbti}`);
  if (p.birth_place) lines.push(`출생지: ${p.birth_place}`);
  return lines.join("\n");
}

function buildPrompt(opts: {
  profile: ProfileRow;
  category: CategoryId;
  fortuneDate: string;
}): string {
  const ctx = buildUserContext(opts.profile);
  const label = FORTUNE_LABEL[opts.category];
  return `[질문자 정보]
${ctx}

[풀이 대상]
- 날짜: ${opts.fortuneDate}
- 카테고리: ${label}

[지시]
질문자의 사주와 ${opts.fortuneDate} 의 일진을 살펴 ${label}을(를) 풀이해주세요.
다음 JSON 스키마를 정확히 따라 단 하나의 JSON 객체로만 응답하세요. 추가 설명·markdown·코드펜스 없이 JSON 만 출력합니다.

{
  "score": 1-100 사이 정수 (운세 점수),
  "title": "20자 이내 한 줄 헤드라인 (반말 친구 톤)",
  "content": "3-5문장의 본문 풀이 (반말 친구 톤, 쉬운 단어)",
  "luckyColor": "행운의 색 (한글 1-3 단어)",
  "luckyNumber": 1-99 사이 정수,
  "luckyDirection": "방향 (예: '동쪽', '북서쪽')"
}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!databaseUrl || !apiKey) {
    console.error("DATABASE_URL 또는 ANTHROPIC_API_KEY 가 비어있음");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  const profiles = await sql<ProfileRow[]>`
    SELECT display_name, birth_date::text, birth_time::text,
           calendar_system, gender, mbti, birth_place
      FROM profiles
      LIMIT 1
  `;

  if (profiles.length === 0) {
    console.error("프로필이 없음. 먼저 가입+온보딩 후 실행.");
    await sql.end();
    process.exit(1);
  }

  const profile = profiles[0];

  console.log("=== 사용자 프로필 ===");
  console.log(JSON.stringify(profile, null, 2));

  const anthropic = new Anthropic({ apiKey });
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "Asia/Seoul",
  });

  for (const cat of CATEGORIES) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📜 ${cat.label} (${cat.id})`);
    console.log("=".repeat(60));

    const userPrompt = buildPrompt({
      profile,
      category: cat.id,
      fortuneDate: today,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: MYSTIC_PERSONA,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";

    try {
      const json = extractJson(text);
      const parsed = dailyFortuneAiSchema.parse(json);
      console.log(`점수: ${parsed.score}점`);
      console.log(`제목: ${parsed.title}`);
      console.log(`본문:`);
      console.log(parsed.content);
      console.log(
        `행운: ${parsed.luckyColor} / ${parsed.luckyNumber} / ${parsed.luckyDirection}`,
      );
      console.log(
        `(토큰 in=${response.usage.input_tokens} out=${response.usage.output_tokens})`,
      );
    } catch (e) {
      console.error("파싱 실패:", e instanceof Error ? e.message : e);
      console.log("원본:", text);
    }
  }

  await sql.end();
}

main().catch((e) => {
  console.error("실행 실패:", e);
  process.exit(2);
});
