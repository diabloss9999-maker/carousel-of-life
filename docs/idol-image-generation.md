# Idol Image Generation Workflow

Use this workflow for every Carousel Nine character image.

## Fixed Rule

1. Pick one master image per character first.
2. Every new image must use that master image as the visual identity reference.
3. Keep the character sheet text exactly the same every time.
4. Change only clothing, background, activity, camera angle, and pose.
5. Keep all members as adults aged 20-23.
6. Preserve hair color, face shape, eye shape, jaw weight, neck length, shoulder width, body build, and core mood from the master image.
7. Do not make slim members bulky, bodybuilder-like, thick-necked, or broad-shouldered.
8. Keep the same Korean virtual idol editorial rendering quality, but do not average the faces together.
9. Vary camera angles across each five-image set: three-quarter view, low-angle full body, high-angle seated/view, strict side profile, and front close-up or over-the-shoulder view.

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
Use the attached master image as the visual identity reference.
Generate the same person with the same face, eyes, hair, body proportion, and mood.
Change only clothing, background, activity, camera angle, and pose.

[Fixed character sheet - keep exactly every time]
<Use the fixed sheet from src/lib/chat/idol-image-profiles.ts>

[Common fixed rules - keep exactly every time]
1. Keep the member as a clearly adult Korean virtual idol, age 20-23.
2. Preserve the master image identity first. Do not change hair color, face width, jaw weight, neck length, shoulder width, or body build.
3. Do not make slim members bulky, bodybuilder-like, thick-necked, or broad-shouldered.
4. Keep the same high-end semi-realistic idol illustration quality.
5. Do not average member faces together. Each member must remain distinct.
6. Vary camera angles across a five-image set: three-quarter view, low-angle full body, high-angle seated/view, strict side profile, and front close-up or over-the-shoulder view.
7. No text, no watermark, no logo, no extra people.

[Only change for this cut]
<New clothing, background, and pose only>
```

The source of truth for the exact per-character sheets is
`src/lib/chat/idol-image-profiles.ts`.
