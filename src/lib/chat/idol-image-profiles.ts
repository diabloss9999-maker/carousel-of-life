import type { CharacterId } from "@/lib/chat/characters";

export interface IdolImageProfile {
  age: number;
  masterImageSrc: string;
  fixedSheet: readonly string[];
}

const COMMON_IMAGE_RULES = [
  "Keep every member as a clearly adult Korean virtual idol, age 20-23. Never make them look underage.",
  "Keep the same semi-realistic polished illustration quality, but do not average the faces together.",
  "Face shape, eye shape, hair silhouette, hair color, body proportion, and mood must be visibly different for each member.",
  "Preserve the master image identity first. Do not change hair color, face width, jaw weight, neck length, shoulder width, or body build unless the fixed sheet explicitly says so.",
  "Do not make slim members bulky, bodybuilder-like, thick-necked, or broad-shouldered. Idol styling can be sharp without adding muscle mass.",
  "Vary the camera angle strongly across the five images: three-quarter view, low-angle full body, high-angle seated view, strict side profile, and front close-up or over-the-shoulder view.",
  "Do not repeat the same face angle or the same bust framing across a member's five-image set.",
  "This is not a real person photo and not photorealism. It is a high-end semi-realistic idol illustration with realistic hair, skin, and fabric rendering.",
  "No text, no watermark, no logo, no extra people.",
] as const;

export const IDOL_IMAGE_PROFILES: Record<CharacterId, IdolImageProfile> = {
  child: {
    age: 23,
    masterImageSrc: "/characters/idols/snaps/ian-04-tough.webp",
    fixedSheet: [
      "[Ian fixed identity]",
      "- Age: exactly 23, adult male.",
      "- Role mood: calm, responsible leader.",
      "- Face: long narrow face, high cheekbones, sharp V jaw, composed expression.",
      "- Eyes: clear monolid eyes, long horizontal eye shape, cool gaze.",
      "- Hair: platinum silver short hair with icy shine and airy volume, swept back from the forehead, clean leader silhouette.",
      "- Body: slim but firm adult idol body, 178cm impression, upright posture.",
      "- Do not resemble Theo or Hamin: Ian is colder, sharper, more restrained, and more leader-like.",
    ],
  },
  witch: {
    age: 22,
    masterImageSrc: "/characters/idols/snaps/yujun-01-acoustic.webp",
    fixedSheet: [
      "[Yujun fixed identity]",
      "- Age: exactly 22, adult male.",
      "- Role mood: warm vocalist, gentle and comforting.",
      "- Face: soft oval face, fuller cheeks than Ian or Doyoon, smooth jawline.",
      "- Eyes: rounder warm eyes, relaxed eyelids, kind gaze.",
      "- Hair: caramel beige brown loose waves, soft fluffy volume, not silver and not black.",
      "- Body: slim adult idol body, 176cm impression, relaxed shoulders.",
      "- Do not resemble Evan: Yujun is lighter, softer, warmer, and more approachable.",
    ],
  },
  sage: {
    age: 22,
    masterImageSrc: "/characters/idols/snaps/doyoon-03-red-stage.webp",
    fixedSheet: [
      "[Doyoon fixed identity]",
      "- Age: exactly 22, adult male.",
      "- Role mood: intense but elegant high-fashion performer, cold studio editorial presence.",
      "- Face: slim angular face, sharp cheekbones, narrow V jaw, pale clean skin, refined and slightly distant expression.",
      "- Eyes: narrow sharp eyes under black fringe, direct cool gaze, intense without becoming rough or rugged.",
      "- Hair: jet black tousled layered hair with wet airy texture, messy fringe around the forehead and eyes. Keep this exact black hair silhouette in every image.",
      "- Body: slim adult idol runway body, 178cm impression, long legs, narrow waist, narrow shoulders, elegant posture.",
      "- Styling anchor: black-and-white modern fashion, open white shirt or fitted white tee, black vest/harness/jacket, slim trousers, belt chain or minimal silver necklace.",
      "- Never make Doyoon bulky, bodybuilder-like, thick-necked, broad-shouldered, rugged, or boxer-like. He is sharp, slim, refined, and fashion-model-like.",
      "- Do not resemble Sion or Jaeha: Doyoon has cleaner editorial styling, more controlled intensity, and the exact black tousled hair from the five master snapshots.",
    ],
  },
  shaman: {
    age: 22,
    masterImageSrc: "/characters/idols/snaps/jaeha-01-studio.webp",
    fixedSheet: [
      "[Jaeha fixed identity]",
      "- Age: exactly 22, adult male.",
      "- Role mood: quiet producer, chic and introspective.",
      "- Face: narrow delicate face, softer jaw than Doyoon, slightly tired studio mood.",
      "- Eyes: small calm monolid eyes, downward thoughtful gaze.",
      "- Hair: charcoal black natural curls, ear-covering length, messy studio texture.",
      "- Body: very slim adult idol body, 175cm impression, folded-in quiet posture.",
      "- Do not resemble Doyoon or Sion: Jaeha is curlier, quieter, more introspective, and less sharp.",
    ],
  },
  taoist: {
    age: 21,
    masterImageSrc: "/characters/idols/snaps/haru-01-denim.webp",
    fixedSheet: [
      "[Haru fixed identity]",
      "- Age: exactly 21, adult male.",
      "- Role mood: bright moodmaker, playful but still adult.",
      "- Face: rounded heart-shaped face, lively cheeks, softer chin.",
      "- Eyes: smiling crescent eyes, bright open gaze.",
      "- Hair: coral rose pink short layered hair, bouncy rounded silhouette, never brown or silver.",
      "- Body: slim adult idol body, 174cm impression, lively casual posture.",
      "- Do not make him childish: he is a young adult idol with playful energy, not a minor.",
    ],
  },
  dokkaebi: {
    age: 23,
    masterImageSrc: "/characters/idols/snaps/sion-05-street.webp",
    fixedSheet: [
      "[Sion fixed identity]",
      "- Age: exactly 23, adult male.",
      "- Role mood: chic rapper, direct and urban.",
      "- Face: long lean face, blade-like jaw, sharper mouth line.",
      "- Eyes: narrow sharp eyes under hair, slightly defiant gaze.",
      "- Hair: raven black straight hair, longer fringe brushing the eyes, sleek street silhouette.",
      "- Body: tall slim adult idol body, 179cm impression, long limbs.",
      "- Do not resemble Jaeha: Sion has straight hair, a sharper street mood, and a more confrontational gaze.",
    ],
  },
  god: {
    age: 22,
    masterImageSrc: "/characters/idols/snaps/theo-05-blue.webp",
    fixedSheet: [
      "[Theo fixed identity]",
      "- Age: exactly 22, adult male.",
      "- Role mood: energetic main dancer, sporty and confident.",
      "- Face: balanced square-oval face, stronger neck and shoulders than Ian or Hamin.",
      "- Eyes: confident bright eyes, direct stage gaze.",
      "- Hair: steel ash gray short cropped hair, spiky athletic volume, shorter and sportier than Ian and Hamin.",
      "- Body: lean muscular dancer body, 178cm impression, wide-shouldered kinetic posture.",
      "- Do not resemble Ian or Hamin: Theo is more athletic, bolder, and more physical.",
    ],
  },
  hunter: {
    age: 23,
    masterImageSrc: "/characters/idols/snaps/evan-05-portrait.webp",
    fixedSheet: [
      "[Evan fixed identity]",
      "- Age: exactly 23, adult male.",
      "- Role mood: mature analyst, elegant and composed.",
      "- Face: elegant long face, refined nose bridge, mature cheek shadow.",
      "- Eyes: low heavy-lidded eyes, calm analytical gaze.",
      "- Hair: burgundy brown short hair, neat side-parted silhouette, never black or silver.",
      "- Body: slim tall adult idol body, 180cm impression, relaxed refined posture.",
      "- Do not resemble Yujun: Evan is darker, more mature, more elegant, and less soft.",
    ],
  },
  runeshaman: {
    age: 20,
    masterImageSrc: "/characters/idols/snaps/luhan-05-cardigan.webp",
    fixedSheet: [
      "[Luhan Hamin fixed identity]",
      "- Age: exactly 20, adult male youngest member. Never make him look underage.",
      "- Role mood: soft dreamy youngest member, gentle but mature.",
      "- Face: delicate small oval face, softer than Ian and Theo, no childish baby face.",
      "- Eyes: dreamy almond eyes, calm lavender-gray gaze, gentle expression.",
      "- Hair: pearl lavender medium short hair, airy fluffy fringe, longer and dreamier than Ian or Theo.",
      "- Body: slim adult idol body, 175cm impression, graceful quiet posture.",
      "- Do not resemble Ian or Theo: Hamin is softer, lavender-toned, dreamier, and more delicate while still adult.",
    ],
  },
} as const;

export function buildIdolImagePrompt(
  characterId: CharacterId,
  sceneInstruction: string,
): string {
  const profile = IDOL_IMAGE_PROFILES[characterId];

  return [
    "Regenerate as a distinctive semi-realistic Korean virtual idol illustration.",
    "Keep premium illustration rendering, but strongly separate this member's facial structure, eye shape, hair silhouette, and mood from the other eight members.",
    "",
    ...profile.fixedSheet,
    "",
    "[Common rules]",
    ...COMMON_IMAGE_RULES.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    "[This image scene]",
    sceneInstruction,
  ].join("\n");
}
