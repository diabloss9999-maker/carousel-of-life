/**
 * 숨겨진 존재 풀.
 *
 * 가챠/컬렉션에는 등장하지 않는다.
 * `HiddenPresence` 컴포넌트가 아주 낮은 확률로 한 명을 골라 화면에 잠깐 나타낸다.
 *
 * 절대 도감/리스트 페이지에 노출하지 말 것. 발견되어야만 의미가 있다.
 */

export type HiddenEntityCategory = "guardian" | "spirit" | "trickster" | "shadow" | "omen";

export interface HiddenEntity {
  id: string;
  /** 표시명 — 실제로는 화면에 거의 안 나옴 (??? 처리됨) */
  name: string;
  category: HiddenEntityCategory;
  imageSrc: string;
  /** 등장 시 한 줄 문장. 짧고 여운 있게. */
  line: string;
}

export const HIDDEN_ENTITIES: HiddenEntity[] = [
  // ── 사신 (4) ──
  { id: "blue_dragon",      name: "청룡", category: "guardian", imageSrc: "/hidden/01_blue_dragon.png",      line: "동쪽 하늘이 짧게 꿈틀거렸습니다." },
  { id: "white_tiger",      name: "백호", category: "guardian", imageSrc: "/hidden/02_white_tiger.png",      line: "서쪽 바람이 발자국을 남기고 지나갔습니다." },
  { id: "vermilion_bird",   name: "주작", category: "guardian", imageSrc: "/hidden/03_vermilion_bird.png",   line: "남쪽에서 잠시 불빛이 깜빡였습니다." },
  { id: "black_tortoise",   name: "현무", category: "guardian", imageSrc: "/hidden/04_black_tortoise.png",   line: "북쪽이 오래 가만히 있었습니다." },

  // ── 신수 (7) ──
  { id: "yellow_dragon",    name: "황룡", category: "guardian", imageSrc: "/hidden/05_yellow_dragon.png",    line: "중심에서 무언가가 회전했습니다." },
  { id: "phoenix",          name: "봉황", category: "guardian", imageSrc: "/hidden/06_phoenix.png",          line: "꺼지지 않은 불씨가 잠시 보였습니다." },
  { id: "haetae",           name: "해태", category: "guardian", imageSrc: "/hidden/07_haetae.png",           line: "옳지 않은 것이 지나가지 못한 자국입니다." },
  { id: "qilin",            name: "기린", category: "guardian", imageSrc: "/hidden/08_qilin.png",            line: "발자국이 풀잎을 밟지 않았습니다." },
  { id: "pegasus",          name: "천마", category: "guardian", imageSrc: "/hidden/09_pegasus.png",          line: "땅을 짚지 않은 그림자가 지나갔습니다." },
  { id: "three_legged_crow",name: "삼족오", category: "guardian", imageSrc: "/hidden/10_three_legged_crow.png",line: "해 안쪽에서 누가 당신을 보고 있습니다." },
  { id: "singu",            name: "신구", category: "guardian", imageSrc: "/hidden/11_singu.png",            line: "잠시 등껍질에 무엇이 새겨졌습니다." },

  // ── 도깨비/요괴 (4) ──
  { id: "dokkaebi",         name: "도깨비", category: "trickster", imageSrc: "/hidden/12_dokkaebi.png",      line: "어둠 속에서 누군가 짧게 웃었습니다." },
  { id: "gumiho",           name: "구미호", category: "trickster", imageSrc: "/hidden/13_gumiho.png",        line: "꼬리 하나가 잠시 비쳤습니다." },
  { id: "imugi",            name: "이무기", category: "trickster", imageSrc: "/hidden/14_imugi.png",         line: "아직 올라가지 못한 무언가가 있었습니다." },
  { id: "duduri",           name: "두두리", category: "trickster", imageSrc: "/hidden/15_duduri.png",        line: "낡은 돌 사이에서 인기척이 났습니다." },

  // ── 어둠/귀신 (6) ──
  { id: "eoduksini",        name: "어둑시니", category: "shadow", imageSrc: "/hidden/16_eoduksini.png",      line: "당신 뒤에 잠시 머물렀습니다." },
  { id: "geuseundae",       name: "그슨대",  category: "shadow", imageSrc: "/hidden/17_geuseundae.png",      line: "키가 점점 자라는 그림자가 보였습니다." },
  { id: "bridge_ghost",     name: "다리귀신", category: "shadow", imageSrc: "/hidden/18_bridge_ghost.png",   line: "건넌 줄 알았던 길이 아직 남아 있습니다." },
  { id: "unmarried_ghost",  name: "처녀총각귀신", category: "shadow", imageSrc: "/hidden/19_unmarried_ghost.png", line: "이름이 불리지 않은 무언가가 있었습니다." },
  { id: "egg_ghost",        name: "달걀귀신", category: "shadow", imageSrc: "/hidden/20_egg_ghost.png",      line: "얼굴이 지워진 자국이 남았습니다." },
  { id: "dueokshini",       name: "두억시니", category: "shadow", imageSrc: "/hidden/21_dueokshini.png",     line: "본 적 없는 형태가 잠시 보였습니다." },

  // ── 길조 (6) ──
  { id: "magpie",           name: "까치",   category: "omen", imageSrc: "/hidden/22_magpie.png",            line: "오늘 누군가 당신 이야기를 했습니다." },
  { id: "crane",            name: "학",     category: "omen", imageSrc: "/hidden/23_crane.png",             line: "오래된 약속이 아직 깨지지 않았습니다." },
  { id: "carp",             name: "잉어",   category: "omen", imageSrc: "/hidden/24_carp.png",              line: "물 안에서 무엇이 위쪽을 봤습니다." },
  { id: "turtle",           name: "거북",   category: "omen", imageSrc: "/hidden/25_turtle.png",            line: "오래 살아남은 흔적이 가까이 있습니다." },
  { id: "deer",             name: "사슴",   category: "omen", imageSrc: "/hidden/26_deer.png",              line: "소리 없이 지나간 발자국이 있습니다." },
  { id: "tiger_magpie",     name: "까치호랑이", category: "omen", imageSrc: "/hidden/27_tiger_magpie.png",   line: "오래된 그림 안에서 누가 웃었습니다." },
];

/** 카테고리별 등장 가중치. shadow는 균열 높을 때, guardian/omen은 평소. */
export function pickHiddenEntity(opts: { fractureLevel: number; isDawn: boolean; isNight: boolean }): HiddenEntity {
  const { fractureLevel, isDawn, isNight } = opts;

  // 균열 높고 새벽이면 shadow 가중치↑, 평소엔 guardian/omen 가중치↑
  const pool = HIDDEN_ENTITIES.flatMap((e) => {
    let weight = 1;
    if (e.category === "shadow") {
      weight = isDawn || fractureLevel >= 3 ? 3 : 0.4;
    } else if (e.category === "guardian") {
      weight = 1.2;
    } else if (e.category === "omen") {
      weight = isNight ? 0.8 : 1.4;
    } else if (e.category === "trickster") {
      weight = 1.1;
    }
    return Array.from({ length: Math.round(weight * 10) }, () => e);
  });

  return pool[Math.floor(Math.random() * pool.length)];
}
