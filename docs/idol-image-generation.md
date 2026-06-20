# Idol Image Generation Workflow

Use this workflow for every Carousel Nine character image.

## Fixed Rule

1. Pick one master image per character first.
2. Every new image must use that master image as the visual reference.
3. Keep the character sheet text exactly the same every time.
4. Change only clothing, background, and pose.
5. Keep all members as adults aged 20-23.
6. Keep the same Korean virtual idol editorial rendering quality, but do not make the faces look averaged together.
7. Vary camera angles across each five-image set: three-quarter view, low-angle full body, high-angle seated/view, strict side profile, and front close-up or over-the-shoulder view.

## Master Images

| Character | Age | Master image |
| --- | ---: | --- |
| Ian | 23 | `/characters/idols/snaps/ian-04-tough.webp` |
| Yujun | 22 | `/characters/idols/snaps/yujun-01-acoustic.webp` |
| Doyoon | 22 | `/characters/idols/snaps/doyoon-03-red-stage.webp` |
| Jaeha | 22 | `/characters/idols/snaps/jaeha-01-studio.webp` |
| Haru | 21 | `/characters/idols/snaps/haru-01-denim.webp` |
| Sion | 23 | `/characters/idols/snaps/sion-05-street.webp` |
| Theo | 22 | `/characters/idols/snaps/theo-05-blue.webp` |
| Evan | 23 | `/characters/idols/snaps/evan-05-portrait.webp` |
| Luhan / Hamin | 20 | `/characters/idols/snaps/luhan-05-cardigan.webp` |

## Prompt Template

```text
첨부한 마스터 이미지를 레퍼런스로 써서 같은 인물, 같은 얼굴, 같은 나이로 생성해.
얼굴, 헤어, 나이, 체형은 절대 바꾸지 말고 의상, 배경, 포즈만 바꿔.

[캐릭터 고정 설정 - 항상 동일하게]
<Use the fixed sheet from src/lib/chat/idol-image-profiles.ts>

[공통 고정 규칙 - 매번 동일하게]
1) 나이대는 만 20~23세 성인으로 고정. 더 어리거나 더 나이 들어 보이게 그리지 마.
2) 같은 세미리얼 일러스트 품질은 유지하되, 멤버끼리 얼굴 골격·눈매·헤어 실루엣이 평균화되지 않게 해.
3) 5장 안에서 카메라 각도를 반복하지 마. 3/4, 로우앵글 전신, 하이앵글, 완전 측면, 정면 클로즈업처럼 확실히 나눠.

[이번 컷에서만 변경할 내용]
<New clothing, background, and pose only>
```

The source of truth for the exact per-character sheets is
`src/lib/chat/idol-image-profiles.ts`.
