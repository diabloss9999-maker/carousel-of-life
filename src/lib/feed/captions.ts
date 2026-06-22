/**
 * 멤버 SNS 피드 캡션 — "멤버 × 사진 장면"에 묶인 글.
 *
 * v1은 멤버 성격에만 맞춘 글이라 ①같은 멤버 글이 비슷하고 ②사진 내용과 따로 놀았다.
 * v2: 사진을 6개 활동 장면(아침·장보기·요리·취미·녹음·무대)으로 한정하고, 각
 * (멤버, 장면)마다 그 장면에 맞는 글을 직접 써둔다 → 사진이 바뀌면 글도 그 장면
 * 이야기로 바뀐다. 모두 존댓말, 팬 호칭은 "라이더", 멤버 성격(말투)을 살린다.
 */
import type { CharacterId } from "@/lib/chat/characters";

/** 피드에 쓰는 6개 활동 장면 — 이미지 폴더명과 일치. */
export const FEED_SCENES = [
  "morning",
  "grocery",
  "cooking",
  "hobby",
  "recording",
  "performance",
] as const;
export type FeedScene = (typeof FEED_SCENES)[number];

const SCENE_RE = /\/(morning|grocery|cooking|hobby|recording|performance)\//;

/** 이미지 경로에서 장면을 추출. 못 찾으면 "hobby". */
export function sceneOf(imagePath: string): FeedScene {
  const m = imagePath.match(SCENE_RE);
  return (m?.[1] as FeedScene) ?? "hobby";
}

/** (멤버, 장면) → 그 사진에 맞는 한마디. */
export const SCENE_CAPTIONS: Record<CharacterId, Record<FeedScene, string>> = {
  // 이안 · 리더 · ISFJ — 차분·담백·멤버를 챙김
  child: {
    morning: "이제 막 일어났어요. 라이더는 아침 챙겨 먹었어요?",
    grocery: "장 보러 나왔어요. 멤버들 먹을 거 좀 사가려고요.",
    cooking: "간단하게 뭐 좀 만들어 먹었어요. 라이더도 끼니 거르지 말고요.",
    hobby: "잠깐 쉬는 중이에요. 이런 여백이 가끔 필요하더라고요.",
    recording: "녹음 부스에 있어요. 오늘은 차분하게 잘 됐어요.",
    performance: "무대 준비 끝났어요. 다들 고생했어요, 라이더도 응원 고마워요.",
  },
  // 유준 · 보컬 · INFJ — 따뜻·부드러움
  witch: {
    morning: "따뜻한 거 한 잔으로 하루를 열었어요. 라이더의 아침은 어때요?",
    grocery: "장 보다가 라이더 생각났어요. 좋아할 것 같은 걸 봤거든요.",
    cooking: "오늘은 직접 만들어봤어요. 마음을 담으니 더 맛있더라고요.",
    hobby: "조용히 쉬는 시간이 좋아요. 라이더랑 같이 있는 기분으로요.",
    recording: "새 곡 가이드 녹음했어요. 라이더한테 제일 먼저 들려주고 싶다.",
    performance: "무대에서 부르는 그 순간이 제일 행복해요. 곧 만나요.",
  },
  // 도윤 · 퍼포머 · ENFJ — 활력·선명
  sage: {
    morning: "기상! 오늘 컨디션 좋아요. 라이더도 가볍게 시작해요.",
    grocery: "장 보는 것도 은근 재밌네요. 뭐 살지 고르는 게 좋아요.",
    cooking: "요리 도전! 생각보다 잘 나왔어요. 다음엔 라이더 것도.",
    hobby: "잠깐 노는 시간. 이럴 때 에너지가 충전돼요.",
    recording: "녹음하면서 또 욕심냈어요. 디테일 살리는 중!",
    performance: "무대 위가 제일 나다워요. 오늘도 풀파워로 갈게요.",
  },
  // 재하 · 프로듀서 · INFP — 조용·섬세
  shaman: {
    morning: "느리게 시작하는 아침. 이런 시간이 좋아요.",
    grocery: "장 보러 나왔는데 괜히 플레이리스트부터 켜요.",
    cooking: "혼자 조용히 만들어 먹는 거 좋아해요. 소박하게요.",
    hobby: "쉬는 날엔 음악에 묻혀 있어요. 라이더는 뭐 하고 있어요?",
    recording: "작업실에서 비트 만지는 중. 이 멜로디… 라이더는 어때요?",
    performance: "무대 뒤는 늘 긴장돼요. 그래도 소리로 다 말할게요.",
  },
  // 하루 · 무드메이커 · ESFP — 밝음·장난
  taoist: {
    morning: "굿모닝! 오늘 왜 이렇게 기분 좋지ㅎㅎ 라이더도 좋은 하루!",
    grocery: "장 보러 왔는데 군것질만 잔뜩 담았어요ㅋㅋ",
    cooking: "오늘 요리 성공! 맛있어서 혼자 감동했잖아요.",
    hobby: "노는 거엔 진심이에요. 라이더 심심하면 저 불러요~",
    recording: "녹음하다 텐션 터졌어요. 오늘 목소리 잘 나와요!",
    performance: "무대 설 생각에 벌써 신나요. 같이 즐겨요 우리!",
  },
  // 시온 · 래퍼 · ISTP — 시크·짧음
  dokkaebi: {
    morning: "방금 일어났어요. …아직 말 걸지 마요.",
    grocery: "장 보러 옴. 필요한 것만 딱 사고 갈래요.",
    cooking: "대충 만들어 먹었어요. 맛은… 그냥 그래요.",
    hobby: "딱히 뭐 안 했어요. 이게 편해요.",
    recording: "가사 쓰다 한 줄 잘 나왔어요. 오늘은 됐어요.",
    performance: "무대 곧이에요. 말 많이 안 할게요. 보여줄게요.",
  },
  // 태오 · 메인댄서 · ESTP — 직선·에너지
  god: {
    morning: "기상 완료! 가볍게 몸 풀고 시작해요. 라이더도 스트레칭!",
    grocery: "장 보는 중. 단백질 위주로 잔뜩 담았어요ㅋㅋ",
    cooking: "운동 끝나고 요리. 오늘도 닭가슴살 구웠어요.",
    hobby: "쉴 때도 몸이 근질근질. 결국 또 움직였어요.",
    recording: "녹음 부스에서도 에너지 폭발. 오늘 잘 나와요!",
    performance: "무대 전 대기실 텐션 최고예요. 풀파워로 간다!",
  },
  // 이현 · 애널리스트 · INTJ — 차분·세련
  hunter: {
    morning: "조용한 아침, 좋은 커피. 이 정도면 완벽한 시작이에요.",
    grocery: "장 보는 것도 취향이 드러나죠. 라이더는 뭘 담아요?",
    cooking: "오늘은 직접 차려봤어요. 과정이 꽤 정돈돼서 좋네요.",
    hobby: "좋은 영화 한 편. 하루가 정리되는 시간이에요.",
    recording: "녹음은 결국 디테일이에요. 한 끗을 다듬는 중.",
    performance: "무대는 계산된 몰입이에요. 곧 보여드릴게요.",
  },
  // 하민 · 막내 · ISFP — 몽환·다정
  runeshaman: {
    morning: "이제 막 눈 떴어요. 창밖이 예뻐서 한참 봤어요.",
    grocery: "장 보러 나왔는데 괜히 설레요. 사소한 게 좋아요.",
    cooking: "서툴지만 만들어봤어요. 라이더도 같이 먹을래요?",
    hobby: "상상하면서 보내는 시간이 제일 편해요. 라이더는요?",
    recording: "녹음 부스는 조용해서 좋아요. 제 목소리에 집중돼요.",
    performance: "무대 위는 떨리지만, 라이더가 있으면 괜찮아요.",
  },
};
