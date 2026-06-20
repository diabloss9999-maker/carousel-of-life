/**
 * 1집 "캐러셀 오브 라이프" 수록곡 가사.
 *
 * 트랙 번호 → 섹션 배열. 각 라인은 [멤버이름 | "ALL" | null, 가사] 튜플.
 * 멤버이름이 있으면 그 멤버의 파트로 하이라이트, "ALL"은 단체, null 은 일반 라인.
 */

export type LyricLine = [member: string | null, text: string];

export interface LyricSection {
  label: string;
  lines: LyricLine[];
}

export const TRACK_LYRICS: Record<number, LyricSection[]> = {
  // ── 1. 인생의 회전목마 ──────────────────────────────────────────────
  1: [
    {
      label: "Intro",
      lines: [
        [null, "(돌아, 돌아)"],
        [null, "불빛이 하나둘 켜지고"],
        [null, "오늘 밤 이 목마는 너와 나의 거야"],
        [null, "(round and round, yeah)"],
      ],
    },
    {
      label: "Verse 1",
      lines: [
        [null, "처음 올라탄 그날엔 세상이 다 반짝였어"],
        [null, "높이 오를수록 조금은 겁이 났던 맘"],
        [null, "내려갈 땐 울었고 다시 오를 땐 웃었지"],
        [null, "한 바퀴 또 한 바퀴, 이게 사는 거란 걸"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "어지러워도 손 놓지 마"],
        [null, "이 멜로디가 멈추기 전에 (우-)"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "인생의 회전목마 (round and round)"],
        [null, "빛과 그림자 사이를 돌아"],
        [null, "기쁨도 아픔도 한 바퀴면 또"],
        [null, "다시 시작되는 melody"],
        [null, "멈추지 않아 우린 (we ride)"],
        [null, "이 음악이 끝나는 날까지"],
        [null, "인생의 회전목마, 돌아 돌아 (oh-oh-oh)"],
      ],
    },
    {
      label: "Rap Verse",
      lines: [
        [null, "Yeah, 어릴 적 꿈꾸던 무대 위 지금 내가 서"],
        [null, "넘어지고 깨져도 박자는 안 놓쳐, no"],
        [null, "두려움은 동전처럼 주머니에 넣어둬"],
        [null, "한 곡이 끝나면 바로 다음 곡을 불러"],
        [null, "빙글빙글 도는 세상, 그 중심을 잡어"],
        [null, "조명이 꺼져도 내 안의 불은 안 꺼져"],
        [null, "같이 탄 네 손, 난 절대 안 놓을게"],
        [null, "이 목마 끝엔 우리 웃고 있을 게, let's go"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "어지러워도 눈 감지 마"],
        [null, "이 순간이 지나기 전에 (우-)"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "인생의 회전목마 (round and round)"],
        [null, "빛과 그림자 사이를 돌아"],
        [null, "기쁨도 아픔도 한 바퀴면 또"],
        [null, "다시 시작되는 melody"],
        [null, "멈추지 않아 우린 (we ride)"],
        [null, "이 음악이 끝나는 날까지"],
        [null, "인생의 회전목마, 돌아 돌아 (oh-oh-oh)"],
      ],
    },
    {
      label: "Bridge",
      lines: [
        [null, "어린 날의 나에게 말해주고 싶어"],
        [null, "그 눈물도 다 이유가 있었다고"],
        [null, "돌고 또 돌아 결국 여기 닿았으니까"],
        [null, "이제는 무섭지 않아 (no more)"],
      ],
    },
    {
      label: "Dance Break",
      lines: [
        [null, "(돌아 돌아) oh-oh-oh"],
        [null, "(올라가, 더 높이) hey!"],
        [null, "(round and round and round)"],
      ],
    },
    {
      label: "Final Chorus",
      lines: [
        [null, "인생의 회전목마 (higher! ↑)"],
        [null, "빛과 그림자 그 위로 올라"],
        [null, "어떤 계절이 와도 한 바퀴면 또"],
        [null, "다시 피어나는 melody"],
        [null, "멈추지 않아 우린 (forever)"],
        [null, "이 무대가 끝나는 날까지"],
        [null, "인생의 회전목마, 돌아 돌아"],
      ],
    },
    {
      label: "Outro",
      lines: [
        [null, "음악이 멈춰도 우린 여기 있어"],
        [null, "내일도 이 목마는 또 돌 테니까"],
        [null, "(돌아... 돌아... 인생의 회전목마)"],
      ],
    },
  ],

  // ── 2. 언제나 (Always) ─────────────────────────────────────────────
  2: [
    {
      label: "Intro",
      lines: [
        [null, "(언제나, 언제나)"],
        [null, "너의 이름만 떠올려도"],
        [null, "오늘 하루가 반짝여, oh"],
      ],
    },
    {
      label: "Verse 1",
      lines: [
        [null, "아침에 눈 뜨면 가장 먼저 너"],
        [null, "별거 아닌 말에도 자꾸 웃게 돼"],
        [null, "손끝이 살짝 닿을 때 그 작은 떨림"],
        [null, "이 맘 들킬까 봐 또 괜히 딴청 부려"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "오늘도 내일도 그 다음도"],
        [null, "절대 변하지 않을 한 가지"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "언제나 (always) 네 곁에 있을게"],
        [null, "어떤 계절이 와도 너의 손 잡고"],
        [null, "빙글빙글 도는 세상 속에서도"],
        [null, "내 중심은 언제나 너 하나"],
        [null, "언제나 (always) 우린 함께야"],
        [null, "이 노래가 끝나도 멈추지 않아"],
        [null, "언제나, 언제나 너야 (oh-oh)"],
      ],
    },
    {
      label: "Rap Verse",
      lines: [
        [null, "설탕보다 달콤한 네 미소 한 스푼"],
        [null, "하루 종일 머릿속이 너로 가득 차, ooh"],
        [null, "약속 같은 거 잘 못 하는 나인데"],
        [null, "너한테만큼은 평생을 걸어볼래"],
        [null, "비 오는 날엔 우산이 되어줄게"],
        [null, "추운 밤엔 제일 따뜻한 손이 될게"],
        [null, "멀리 돌아가도 결국 너에게로"],
        [null, "모든 길이 너로 이어져 있는걸 (forever)"],
      ],
    },
    {
      label: "Bridge",
      lines: [
        [null, "화려한 약속은 못 해도"],
        [null, "이 마음 하나는 다 진심이야"],
        [null, "네가 어디에 있든"],
        [null, "난 언제나 너의 편이야"],
      ],
    },
    {
      label: "Final Chorus",
      lines: [
        [null, "언제나 (always) 네 곁에 있을게"],
        [null, "어떤 계절이 와도 너의 손 잡고"],
        [null, "빙글빙글 도는 세상 그 끝까지"],
        [null, "내 중심은 언제나 너 하나"],
        [null, "언제나 (always) 우린 함께야"],
        [null, "시간이 흘러도 변하지 않아"],
        [null, "언제나, 언제나 너야 (oh-oh-oh)"],
      ],
    },
    {
      label: "Outro",
      lines: [
        [null, "(언제나... 언제나...)"],
        [null, "내일도 네 손 잡고 웃을게"],
        [null, "oh, 언제나 너야"],
      ],
    },
  ],

  // ── 3. Fly With You ───────────────────────────────────────────────
  3: [
    {
      label: "Intro",
      lines: [
        [null, "괜찮아, 고개 들어"],
        [null, "네 앞에 아침이 와"],
        [null, "우리가 함께라면"],
        [null, "어둠도 길을 비켜가"],
      ],
    },
    {
      label: "Verse 1",
      lines: [
        [null, "길었던 밤을 지나"],
        [null, "숨이 차오른 순간"],
        [null, "멈춰 선 너의 눈빛에"],
        [null, "작은 별이 켜져"],
        [null, "혼자라 느낀 날도"],
        [null, "끝이 안 보인 날도"],
        [null, "사실은 너의 걸음이"],
        [null, "기적을 만들고 있었어"],
      ],
    },
    {
      label: "Rap 1",
      lines: [
        [null, "넘어져도 다시 rise up"],
        [null, "눈물 뒤에 피는 my luck"],
        [null, "느린 속도라도 좋아"],
        [null, "너의 계절은 반드시 와"],
        [null, "세상이 뭐라 해도 keep going"],
        [null, "작은 심장 소리도 glowing"],
        [null, "지금 이 노래가 닿는다면"],
        [null, "손을 뻗어, we are rolling"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "찬란하게 번져가"],
        [null, "가슴 깊은 곳의 fire"],
        [null, "두려움은 멀어져"],
        [null, "이제 시작이야"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "빛나, 더 높이 올라"],
        [null, "오늘의 너는 눈부셔"],
        [null, "울던 날까지 안고서"],
        [null, "환하게 웃어도 돼"],
        [null, "날아, 더 멀리 날아"],
        [null, "꿈은 아직 끝나지 않아"],
        [null, "손을 잡아, 함께 가자"],
        [null, "우린 빛이 될 거야"],
      ],
    },
    {
      label: "Post-Chorus",
      lines: [
        [null, "Oh-oh-oh, louder"],
        [null, "희망은 우리를 불러"],
        [null, "Oh-oh-oh, brighter"],
        [null, "세상 끝까지 빛나"],
      ],
    },
    {
      label: "Verse 2",
      lines: [
        [null, "기다린 만큼 더"],
        [null, "눈부신 날이 올 거야"],
        [null, "닫혔던 문틈 사이로"],
        [null, "바람이 불어와"],
        [null, "작은 용기 하나"],
        [null, "그거면 충분해"],
        [null, "너라는 이름만으로"],
        [null, "이미 아름다워"],
      ],
    },
    {
      label: "Rap 2",
      lines: [
        [null, "Turn it up, turn it up"],
        [null, "심장이 뛰는 대로"],
        [null, "Run it up, run it up"],
        [null, "망설임은 뒤로"],
        [null, "손끝에 닿은 하늘"],
        [null, "네 안에 있던 파랑"],
        [null, "지금부터 펼쳐봐"],
        [null, "너만의 panorama"],
      ],
    },
    {
      label: "Bridge",
      lines: [
        [null, "잠시 흔들려도 괜찮아"],
        [null, "비가 내려도 괜찮아"],
        [null, "그 모든 날이 모여서"],
        [null, "너를 더 빛나게 해"],
        [null, "아홉 개의 목소리로"],
        [null, "너의 이름을 부를게"],
        [null, "가장 환한 순간까지"],
        [null, "우리가 곁에 있을게"],
      ],
    },
    {
      label: "Dance Break",
      lines: [
        [null, "Hey, hey, raise your light"],
        [null, "Hey, hey, touch the sky"],
        [null, "Hey, hey, feel alive"],
        [null, "We shine, we shine tonight"],
      ],
    },
    {
      label: "Final Chorus",
      lines: [
        [null, "빛나, 더 크게 외쳐"],
        [null, "오늘의 우린 눈부셔"],
        [null, "외롭던 날도 지나서"],
        [null, "축제가 되어줄 거야"],
        [null, "날아, 더 멀리 날아"],
        [null, "희망은 끝나지 않아"],
        [null, "손을 잡아, 함께 가자"],
        [null, "우린 빛이 될 거야"],
      ],
    },
    {
      label: "Outro",
      lines: [
        [null, "Oh-oh-oh, louder"],
        [null, "너는 혼자가 아니야"],
        [null, "Oh-oh-oh, brighter"],
        [null, "우리의 빛은 계속돼"],
      ],
    },
  ],

  // ── 4. 올라타 (Ride On) ────────────────────────────────────────────
  4: [
    {
      label: "Intro",
      lines: [
        [null, "Yeah"],
        [null, "Carousel Nine"],
        [null, "올라타"],
        [null, "We go round, we go up"],
      ],
    },
    {
      label: "Verse 1",
      lines: [
        [null, "불빛이 켜져, 숨이 더 빨라져"],
        [null, "발끝의 떨림이 무대를 깨워"],
        [null, "기다린 순간이 눈앞에 펼쳐져"],
        [null, "멈출 수 없어, 이미 시작됐어"],
      ],
    },
    {
      label: "Rap 1",
      lines: [
        [null, "Step in, 발을 맞춰"],
        [null, "심장은 kick and snare"],
        [null, "불안은 뒤로 던져"],
        [null, "우린 이미 in the air"],
        [null, "돌고 돌아도 안 어지러워"],
        [null, "중심은 내가 잡아"],
        [null, "낮게 깔린 bass 위로"],
        [null, "내 이름을 새겨놔"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "조용했던 밤이"],
        [null, "소리 내어 타올라"],
        [null, "두려움은 fade out"],
        [null, "지금 우린 올라가"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "올라타, 올라타"],
        [null, "이 리듬 위로 ride"],
        [null, "끝까지 달려가"],
        [null, "We never stop tonight"],
        [null, "돌아가, 돌아가"],
        [null, "더 높이 spinning round"],
        [null, "세상이 흔들려도"],
        [null, "We never coming down"],
      ],
    },
    {
      label: "Post-Chorus",
      lines: [
        [null, "Boom, boom, beat drop"],
        [null, "숨 막히게 더"],
        [null, "Boom, boom, don't stop"],
        [null, "전부 깨워"],
        [null, "올라타, 올라타"],
        [null, "이 리듬 위로 ride"],
        [null, "Carousel, carousel"],
        [null, "We own the night"],
      ],
    },
    {
      label: "Verse 2",
      lines: [
        [null, "시선은 위로, rule은 다 뒤로"],
        [null, "누가 뭐래도 우린 우리 식으로"],
        [null, "정답은 없어도 박자는 있어"],
        [null, "이 순간 안에서 길을 만들고 있어"],
      ],
    },
    {
      label: "Rap 2",
      lines: [
        [null, "Click clack, flash light"],
        [null, "터져 나와 highlight"],
        [null, "검은 밤을 가르는"],
        [null, "Nine sparks, we ignite"],
        [null, "No cap, no limit"],
        [null, "우린 멈춤 없이 vivid"],
        [null, "무대 위의 gravity"],
        [null, "다 뒤집어, flip it"],
      ],
    },
    {
      label: "Bridge",
      lines: [
        [null, "잠깐의 침묵 뒤에"],
        [null, "더 크게 터지는 sound"],
        [null, "어둠이 깊을수록"],
        [null, "우린 선명해져 now"],
        [null, "아홉 개의 발걸음"],
        [null, "하나로 울리는 ground"],
        [null, "눈앞의 모든 한계를"],
        [null, "부숴버려 loud"],
      ],
    },
    {
      label: "Final Chorus",
      lines: [
        [null, "올라타, 올라타"],
        [null, "더 세게 make it ride"],
        [null, "심장이 터질 만큼"],
        [null, "We never stop tonight"],
        [null, "돌아가, 돌아가"],
        [null, "더 높이 spinning round"],
        [null, "세상이 흔들려도"],
        [null, "We never coming down"],
      ],
    },
    {
      label: "Outro",
      lines: [
        [null, "Carousel, carousel"],
        [null, "We own the night"],
        [null, "Carousel, carousel"],
        [null, "올라타"],
      ],
    },
  ],

  // ── 5. 주파수 (Frequency) ──────────────────────────────────────────
  5: [
    {
      label: "Intro",
      lines: [
        [null, "(robotic vocal chops, distant radio signal)"],
        [null, "Can you hear me?"],
        [null, "We're still here"],
        [null, "네 신호가 작아져도"],
        [null, "We won't disappear"],
        [null, "Still here, still here"],
        [null, "In the dark, we're still here"],
        [null, "Still here, still here"],
        [null, "We remember your light"],
      ],
    },
    {
      label: "Verse 1",
      lines: [
        [null, "꺼진 neon 아래 혼자 선 밤"],
        [null, "숨소리마저 noise에 잠겨"],
        [null, "괜찮은 척 웃던 너의 screen"],
        [null, "안쪽엔 아직 비가 내려"],
        [null, "도망치듯 달려온 하루 끝"],
        [null, "심장은 low battery, blinking red"],
        [null, "말 안 해도 알아, 너의 error"],
        [null, "오늘은 버틴 것만으로 enough"],
        [null, "차가운 도시가 널 밀어내도"],
        [null, "네가 틀린 건 아니야"],
        [null, "세상이 너무 빠르게 돌아도"],
        [null, "너의 속도로 가도 돼 tonight"],
      ],
    },
    {
      label: "Rap 1",
      lines: [
        [null, "Yeah, 멈춰도 돼, break down, no shame"],
        [null, "부서진 frame도 너의 name"],
        [null, "세상이 널 재단해도"],
        [null, "우린 너를 숫자로 안 세"],
        [null, "Dark zone, black rain, 길을 잃은 maze"],
        [null, "손 내밀어, lock on, 너를 향해 trace"],
        [null, "네 아픔은 glitch가 아냐"],
        [null, "살아있단 signal, don't erase"],
        [null, "숨이 막혀오는 midnight"],
        [null, "혼자라고 느낀 그 순간"],
        [null, "우린 같은 하늘 밑에 있어"],
        [null, "너의 주파수에 맞춰 run"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "눈을 감아도 돼"],
        [null, "잠시 숨을 놓아도 돼"],
        [null, "무너진 마음 깊은 곳에"],
        [null, "아직 작은 pulse가 뛰어"],
        [null, "멀어진 별빛 같아도"],
        [null, "우리가 너를 찾아갈게"],
        [null, "너의 어둠 끝에서"],
        [null, "I'll be your light"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "Hold on, 너는 혼자가 아냐"],
        [null, "Broken sky 아래 내가 서 있을게"],
        [null, "Cry out, 네 눈물이 번져도"],
        [null, "빛이 돼 줄게, right here in the dark"],
        [null, "We rise, 차가운 도시의 밤"],
        [null, "네 이름을 불러 다시 warm it up"],
        [null, "끝이라 느낀 그 순간에도"],
        [null, "Together we heal the pain"],
        [null, "Never let you fade"],
        [null, "I'm still here, still here"],
        [null, "Never let you fade"],
        [null, "I'm still here, still here"],
      ],
    },
    {
      label: "Post-Chorus",
      lines: [
        [null, "Still here, still here"],
        [null, "네 곁에, still here"],
        [null, "숨이 작아져도"],
        [null, "We will keep your flame"],
        [null, "Still here, still here"],
        [null, "Don't disappear"],
        [null, "너의 밤이 끝날 때까지"],
        [null, "We're still here"],
      ],
    },
    {
      label: "Verse 2",
      lines: [
        [null, "깨진 유리 위에 비친 너는"],
        [null, "조금 지쳐 보여도 beautiful"],
        [null, "상처마다 새겨진 circuit"],
        [null, "그건 네가 살아온 proof"],
        [null, "차가운 말들이 널 지나가"],
        [null, "맘의 방어막이 무너져도"],
        [null, "네가 너를 미워하지 않게"],
        [null, "우리가 대신 안아줄게"],
        [null, "오늘의 넌 완벽하지 않아도"],
        [null, "이미 충분히 빛나"],
        [null, "느리게 걸어도 괜찮아"],
        [null, "방향은 아직 너를 향해 있어"],
      ],
    },
    {
      label: "Rap 2",
      lines: [
        [null, "Low voice in the blackout"],
        [null, "네 침묵 속에 들어가"],
        [null, "말없이 앉아 있을게"],
        [null, "답을 찾지 못해도 괜찮아"],
        [null, "Bad day, sad face, reset은 없어도"],
        [null, "Next page, new phase, 우린 같이 걸어"],
        [null, "울어도 돼, 무너져도 돼"],
        [null, "다시 일어나는 속도는 너의 것"],
        [null, "Nobody knows your pain like you"],
        [null, "그래도 혼자 두진 않아"],
        [null, "너의 꺼진 화면 위로"],
        [null, "우리 목소릴 띄워, stay with us"],
      ],
    },
    {
      label: "Pre-Chorus",
      lines: [
        [null, "눈을 감아도 돼"],
        [null, "잠시 숨을 놓아도 돼"],
        [null, "무너진 마음 깊은 곳에"],
        [null, "아직 작은 pulse가 뛰어"],
        [null, "멀어진 별빛 같아도"],
        [null, "우리가 너를 찾아갈게"],
        [null, "너의 어둠 끝에서"],
        [null, "I'll be your light"],
      ],
    },
    {
      label: "Chorus",
      lines: [
        [null, "Hold on, 너는 혼자가 아냐"],
        [null, "Broken sky 아래 내가 서 있을게"],
        [null, "Cry out, 네 눈물이 번져도"],
        [null, "빛이 돼 줄게, right here in the dark"],
        [null, "We rise, 차가운 도시의 밤"],
        [null, "네 이름을 불러 다시 warm it up"],
        [null, "끝이라 느낀 그 순간에도"],
        [null, "Together we heal the pain"],
        [null, "Never let you fade"],
        [null, "I'm still here, still here"],
        [null, "Never let you fade"],
        [null, "I'm still here, still here"],
      ],
    },
    {
      label: "Bridge",
      lines: [
        [null, "(cinematic pads, emotional male harmonies)"],
        [null, "세상이 너무 커 보여"],
        [null, "네가 작아진 것 같을 때"],
        [null, "기억해, 너의 숨 하나도"],
        [null, "우리에겐 가장 큰 light"],
        [null, "서두르지 않아도 돼"],
        [null, "회복은 느린 sunrise"],
        [null, "상처 난 마음 너머로"],
        [null, "새벽이 다시 와"],
        [null, "너의 모든 밤을"],
        [null, "다 이해할 수는 없어도"],
        [null, "네 곁에 서 있을게"],
        [null, "무너지지 않게"],
      ],
    },
    {
      label: "Build",
      lines: [
        [null, "(call and response, rising synths)"],
        [null, "Are you there?"],
        [null, "I'm right here"],
        [null, "Can you breathe?"],
        [null, "I'm right here"],
        [null, "Don't let go"],
        [null, "I'm right here"],
        [null, "We are, we are"],
        [null, "We are your light"],
        [null, "Are you there?"],
        [null, "I'm right here"],
        [null, "Can you breathe?"],
        [null, "I'm right here"],
        [null, "Don't let go"],
        [null, "I'm right here"],
        [null, "We are, we are"],
        [null, "We are your light"],
      ],
    },
    {
      label: "Final Chorus",
      lines: [
        [null, "Hold on, 너는 혼자가 아냐"],
        [null, "Broken world 속에 우리가 있을게"],
        [null, "Cry out, 네 눈물이 빛나면"],
        [null, "길이 돼 줄게, burn bright in the dark"],
        [null, "We rise, 영원히 울리는 heart"],
        [null, "네 아픔을 안고 더 높이 fly up"],
        [null, "끝이라 느낀 밤 위로"],
        [null, "Together we heal the pain"],
        [null, "Never let you fade"],
        [null, "You're still here, still here"],
        [null, "Never let you fade"],
        [null, "You're still here, still here"],
        [null, "We rise, we rise"],
        [null, "너의 빛을 따라"],
        [null, "We shine, we shine"],
        [null, "다시 살아나"],
        [null, "끝이라 느낀 그 순간에도"],
        [null, "Together we heal the pain"],
        [null, "Never let you fade"],
        [null, "You're still here, still here"],
      ],
    },
    {
      label: "Outro",
      lines: [
        [null, "(robotic vocal chops fading)"],
        [null, "Still here, still here"],
        [null, "Don't disappear"],
        [null, "네가 너를 잃어도"],
        [null, "We remember your light"],
        [null, "Still here, still here"],
        [null, "In the dark, we're still here"],
        [null, "Still here"],
        [null, "Still here"],
        [null, "We remember your light"],
      ],
    },
  ],
};
