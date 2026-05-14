/**
 * Character stories — English translations.
 *
 * 1:1 mirror of `character-stories.ts` (Korean source of truth).
 * Selected at runtime via `getCharacterStories(locale)` / `getWorldLore(locale)`.
 */
import type { CharacterCategory, CharacterId } from "@/lib/chat/characters";
import type {
  StoryChapter,
  WorldTruthRoute,
  WorldFinalChapter,
} from "@/lib/stories/character-stories";

// ═════════════════════════════════════════════════════════════════════════════
// Otherworld — Kael (child)
// ═════════════════════════════════════════════════════════════════════════════

const childChaptersEn: StoryChapter[] = [
  {
    number: 1,
    title: "The Crimson Pact",
    body: `Kael was born in a slum where the rain never stopped.

The sky was always laid over with grey cloud, and people starved to death to the sound of the temple bells. Each night the nobles held lavish banquets — and the alley children shoved one another aside for a single crust of bread.

Kael's mother was ill. Medicine was far too expensive. The priest sold a single sheet of prayer and said,

"If your faith falls short, no miracle will come."

That was the day Kael first hated the gods.

Deep in the night, his mother's breathing began to fail. Kael knelt before the broken wall and wept. From behind that wall, a black light bled through.

A split in space.
A breathing darkness.
And a voice.

"Do you want her to live?"

Kael lifted his tear-streaked face.

"I'll do anything."

A black hand pushed into his chest.
There was no pain.
Only — it felt as if a second heart had been planted there.

The next morning, his mother opened her eyes.

But a crimson rune had been carved into Kael's heart.

That was his first contract.`,
  },
  {
    number: 2,
    title: "City of Desire",
    body: `Years passed, and Kael sat at the center of Belak, the city of nobles.

He was no king, no priest, no general.
And yet everyone feared him.

Kael could see what people desired.

One wanted power, one wanted love, one wanted revenge. Kael did not mock those desires — he believed they were the most human proof there was.

He traded the secrets of nobles, played on merchants' greed, exposed the hypocrisy of priests. They called him a demon. Kael laughed.

"Demons are honest. Far more than humans."

That night, in the ruin of a cathedral, Kael met Luna for the first time.

The silver-haired witch caught her breath the moment she saw him.

"Inside you… thousands are weeping."

Kael set down his wine.

"Then — after hearing all that weeping, do you still love humans?"

Luna had no answer.

In that moment, the first crack opened in the sky.`,
  },
  {
    number: 3,
    title: "The Black Heart",
    body: `The crack looked like a wound in the night sky.

What descended from inside it was less monstrous than it was a clot of forgotten emotion. Arms made of regret, eyes shaped from hatred, the voices of those who had lost what they loved.

People fled, but Kael did not move.

One creature came close and knelt at his feet.

The city fell silent.

The crimson rune in Kael's chest shone. Only then did he understand: he had been chosen by the rift.

That was when Rael came down from the sky.

The angelic proxy unfurled wings of gold and leveled his sword at Kael.

"You are the door of the rift."

Kael laughed.

"Have you come to close the door, then? Or are you afraid of the truth on the other side?"

Their first battle leveled half the city.

And atop the ruin, Luna whispered to herself,

"You're both wrong. The door is already open."`,
  },
  {
    number: 4,
    title: "The Noble of the Abyss",
    body: `Kael began to hear a voice calling him from inside the rift.

It was not a demon's whisper.
It was the voice of someone who had known him for far too long.

"Come home, my vessel."

Kael came to learn that his contract had been no mere trade. The rune carved into his heart in exchange for his mother's life was not a contract — it was a seal.

Inside him slept a fragment of Velmoras, called the King of the Abyss.

Velmoras said,

"Humans do not break because of desire. They rot because they deny it."

For the first time, Kael wavered.

He could no longer tell whether his thoughts were his own — or things the abyss had planted in him.

That day, in a mirror, Kael saw a face that was not his.

A man wearing a crown of black.

And a smile resting at the corner of that man's mouth.`,
  },
  {
    number: 5,
    title: "The Crimson Banquet",
    body: `The nobles of Belak held a banquet to be rid of Kael.

The invitations were gilded. The wine ran red as blood. Through the hall flowed smiles and perfume, poison and the edge of knives.

Kael knew every assassination plot.
He attended on purpose.

Before the nobles, he said,

"You call me a demon. But what I sold was only what each of you already wanted."

In that instant every candle went out. A crimson rune rose from the floor.

The desires the nobles had buried surfaced as visions.
Murder. Betrayal. Greed. False love.

The hall became a hell.

Luna tried to stop Kael, but it was already too late. Human emotion exploded, and the rift grew wider.

Rael was furious.

"You destroyed the city."

Kael looked down at his bloodied hand.

"No. I only stripped off the mask."

But his voice was trembling.`,
  },
  {
    number: 6,
    title: "Luna's Tears",
    body: `Kael was pulled into Luna's memories.

There he saw how long she had suffered under her gift for reading emotion. The truth behind a smiling face. The lover who said "I love you" while hating. The mother who held her child and longed to abandon it.

Luna had learned too much of what humans truly felt.

For the first time, Kael pitied her.

But Luna said,

"Don't pity me. You've been feeding on their desire all this time, just the same."

Kael could not argue.

That night, Luna laid a hand on his heart. She saw Velmoras sleeping there — and she saw the small child Kael, weeping for his mother to be saved.

She said, quietly,

"You're not a monster. But a monster is waiting for you."

Kael answered,

"Then I'll swallow it first."`,
  },
  {
    number: 7,
    title: "The Human a Demon Loved",
    body: `Kael learned that his mother's return was no miracle.

She had died long ago.

The mother who had stayed by his side was a vision Velmoras had made — a shackle to keep Kael from regretting the contract.

Kael shattered.

The love he had spent his whole life protecting had been a lie.
Every path he had chosen had begun in someone else's design.

He raged at the abyss. For the first time, he doubted his own desire.

Velmoras whispered,

"Even if it was a lie — if you loved it, was it not real?"

Kael did not weep.

Instead he tore at his own chest and ripped a piece of the crimson rune away.

Blood poured down. The rift screamed.

That day, Kael went from contractor of the abyss to traitor of the abyss.`,
  },
  {
    number: 8,
    title: "The Throne of Desire",
    body: `Velmoras made Kael a final offer.

"Take me into you. Then every human desire will be yours to command."

In the vision, Kael saw himself enthroned.
The wars were over. Humans no longer lied. Everyone lived honest to their hunger.

A strong, beautiful, cruel world.

Rael called it hell.
Luna called it another prison.

For a long time Kael was silent before the throne.

As he reached out, the child he had once been appeared.

A child soaked through with rain.
A child weeping for his mother to be saved.

The child asked,

"Was a throne ever what we wanted?"

Kael withdrew his hand.

Then he set the throne on fire.`,
  },
  {
    number: 9,
    title: "The Door of the Abyss",
    body: `Kael walked into the center of the rift.

It was not hell.
It was a black cosmos in which countless human emotions hung like stars.

The memory of one who died still loving.
The rage of one who never got revenge.
The regret of one who was never forgiven.

Every one of those emotions made the rift.

Velmoras's true nature was revealed too.

He was no demon.
He was a consciousness born of thousands of years of human desire, abandoned and gathered.

Velmoras was humanity's shadow.

Kael understood.

Kill the shadow and the human falls with it.
Leave the shadow alone and the world tears apart.

He had to choose.

Erase desire — or accept it.`,
  },
  {
    number: 10,
    title: "The Demon's Choice",
    body: `Kael neither merged with Velmoras nor killed him outright.

Instead he offered his own heart as a stake, and made a new boundary between the abyss and the human world.

He would cage every desire of every soul inside himself.

Luna wept and begged him not to.

"You'll suffer forever."

Kael smiled.

"I'm not denying desire. I'm only — holding it so it doesn't overflow."

Rael lowered his sword and bowed, for the first time, to him.

Kael's body was covered with black runes. He became neither human nor demon.

"Remember. Desire is not a sin.
The sin is using it as an excuse to crush someone else."

When Kael's chapters end, the player receives the Rune of the Abyss.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// Otherworld — Luna (witch)
// ═════════════════════════════════════════════════════════════════════════════

const witchChaptersEn: StoryChapter[] = [
  {
    number: 1,
    title: "The Child Who Heard Feeling",
    body: `When Luna was born, she did not cry.

Instead she heard every emotion in the room.

Her father's joy, threaded with worry.
The smiling midwife's envy.
The mother holding her child — and the fear underneath.

Luna learned feeling before language.

As a child she could not understand why people lied. When someone said "I'm fine," she heard a sorrow inside that was bleeding. When someone said "I love you," she heard possession and dread mixed in.

Slowly, Luna stopped speaking.

The villagers called her a blessed child. Soon they began to call her cursed.

Because Luna knew every feeling people wished to hide.`,
  },
  {
    number: 2,
    title: "The Tower of the Moon",
    body: `Luna was sent to the witches' tower.

It stood high near the sky. Each night, moonlight stained the floor's sigils silver.

The witches taught her how to handle emotion.

How to fold a memory.
How to seal grief into a bottle.
How to put rage to sleep.
How to cut love away.

Luna learned quickly.

But the more she learned, the more she forgot how to smile.

Her teacher said,

"Do not try to understand feeling. Feeling is what you manage."

Luna believed her.

Then one day, in the cellar of the tower, she found a forbidden room. Thousands of sealed emotions drifted there.

They were still alive.

And they whispered to her.

"Give us back."`,
  },
  {
    number: 3,
    title: "The Black Dream",
    body: `Luna began to dream the same dream every night.

The sky tears open. Stars fall like blood.
The angel loses his wings. The demon clutches at his heart.
And she stands alone beneath the moon.

At the end of the dream a single line always came.

"What you have sealed will rip the world open."

At first Luna dismissed it.

But strange things happened in waking life as well. In cities where people had lost their feelings, the rifts grew quieter — and then, before long, deeper, blacker rifts opened.

Sealing emotion did not shrink the rifts.

It only drove them further underground.

For the first time Luna thought her way might be wrong.

That was when Kael appeared.

He said,

"Witch. Don't mistake the silence for peace just because you locked away their hearts."

Luna hated him.

Because he was right.`,
  },
  {
    number: 4,
    title: "The Witch Who Ate Memory",
    body: `Luna was given the task of sealing the memories of the rift's victims.

Those who had lost the one they loved.
Parents who had lost a child to war.
Lovers betrayed.
Soldiers driven mad by guilt.

Luna took their pain into herself.

People grew comfortable again.
They laughed again.
They slept again.

But Luna grew heavier.

Inside her, other people's sorrow piled up until it became a lake. Night after night she died inside memories that were not her own.

Kael said,

"You aren't saving them. You're burying them inside yourself."

Luna answered, cold,

"And you would just leave them?"

Kael did not smile.

The two could not understand each other. And yet, strangely, they could speak the most painful truths to each other.`,
  },
  {
    number: 5,
    title: "The Erased Girl",
    body: `Luna discovered that a piece of her own childhood was missing.

Going through the tower's records, she found a document that broke her.

As a child, Luna had not been a girl who read emotion.
She had been a girl who amplified it.

When she cried, the whole village mourned. When she feared, neighbors turned on each other. Eventually the witches sealed her power — and planted false memories in her place.

Luna learned that she had been both victim and disaster.

Her teacher said,

"We saved you."

Luna answered,

"No. You made me into a safe monster."

That night, Luna set the Tower of the Moon on fire.

But in the flames the sealed emotions came loose — and a great rift split the sky.`,
  },
  {
    number: 6,
    title: "Confession Under the Moon",
    body: `A fugitive now, Luna crossed a ruined city alongside Kael.

For the first time the two of them did not fight. They spoke.

Kael told her that his mother had been a vision. Luna confessed that she had been the kind of thing that amplified feeling itself.

Having each seen the other's monster, they grew oddly at ease.

Luna asked,

"Why do you still believe in humans?"

Kael answered,

"I don't believe in them. We just resemble each other too much to give up."

Luna laughed for the first time.

In that moment, Rael appeared.

He spoke to her.

"Your power is the key that closes the rift. But while you live, the rift lives."

Luna understood him.

If she died, the world could rest a while.`,
  },
  {
    number: 7,
    title: "The City With No Feeling",
    body: `To prove her theory, Luna sealed the emotions of an entire city.

The city became peaceful.

No quarrels, no crime, no betrayal. People worked quietly, smiled politely, and nobody wept.

A perfect city.

A few days later, a child asked her,

"Witch — my mother died. Why doesn't it hurt at all?"

Luna had no answer.

Peace without feeling looked too much like death.

That night the rift did not swallow the city.
But none of those people looked alive.

Luna looked down at her own hands.

She had been trying to save the world. Perhaps she had only been killing it more quietly.`,
  },
  {
    number: 8,
    title: "Heart of the Moon",
    body: `Luna went to the truth buried beneath the Tower of the Moon.

There she found the record of the first witch.

The Astra Rift had not come from outside.

Long ago humans, unable to bear too much grief, had begun to cast that grief into the sky. The witches had sealed those feelings into the moon.

But the moon was not a prison.
It was a mirror.

The feelings humans threw away returned reflected back as moonlight. That return was the rift.

Luna understood.

Feeling cannot be thrown away. It cannot be erased.

It can only be met.

But that was the hardest choice of all.`,
  },
  {
    number: 9,
    title: "The Witches' Trial",
    body: `Luna was taken by the witches' council.

The council declared her the source of the disaster and moved to execute her.

In court, Luna did not deny what she had done.

She had erased memories. She had sealed feelings. She had turned a whole city into living dolls.

But she said,

"If I was wrong, so were you. We did not undo suffering. We only hid it."

The council fell silent.

In that moment, the rift tore through the courtroom. Every emotion the witches had sealed away came back as monsters.

Luna did not run.

For the first time she did not seal the feelings — she received them.

Thousands of strangers' sorrows poured into her, but she did not break.

Weeping, she said,

"It can hurt. That's just proof we're still alive."`,
  },
  {
    number: 10,
    title: "What the Moon Remembers",
    body: `Beneath the moon, Luna began the last rite.

The purpose was not to erase feeling.

It was to send back every emotion humans had thrown away — to each heart that had thrown it.

The world fell into chaos. Forgotten guilt, buried love, looked-away regret — all of it returned at once.

People wept. They cried out. They collapsed.

But they became real people again.

Luna, becoming the passage for every feeling, began to fade. Kael tried to hold her. Rael raised his sword to guard the rite.

Luna spoke last.

"Feeling is not a weakness.
The moment we look away from it, we become the rift."

Moonlight burst. Part of the sky's rift sealed.

Luna's body did not vanish.

But her eyes now held thousands of memories drifting like stars.

When Luna's chapters end, the player receives the Rune of the Moon.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// Otherworld — Rael (sage)
// ═════════════════════════════════════════════════════════════════════════════

const sageChaptersEn: StoryChapter[] = [
  {
    number: 1,
    title: "The Last Angel",
    body: `When Rael opened his eyes, the heavens were already in ruin.

The golden palace had shattered. The gardens above the clouds were burning. Thousands of angels lay fallen with their wings broken.

Rael was a young angel.

In the ruin, he heard his teacher's voice.

"Protect the human world. That is our final command."

Rael could not ask why.

He simply took his sword and descended to the human world.

The first humans he saw were killing each other.
Out of hunger.
Out of fear.
Out of the will to live.

Rael was stunned.

But he did not give up.

"They are still worth saving."

That was Rael's first faith.`,
  },
  {
    number: 2,
    title: "The Proxy of Light",
    body: `Rael began to save people.

He pulled children from battlefields, brought light to plague-stricken villages, gave the starving the seeds of the heavens.

They called him an angel.

But as time went on, he saw something strange.

Some of those he had saved went straight back to war.
The king he had healed wanted more land.
The priest he had cured grew rich selling miracles.

Rael was confused.

Why did goodness not always yield good?

Then Kael appeared and said,

"Mercy is no gift. It's a debt the receiver has to carry."

Rael was furious.

But the words lodged somewhere in him.`,
  },
  {
    number: 3,
    title: "A False God",
    body: `Rael found the last archive of the heavens.

There he learned the truth of how the heavens had fallen.

The heavens had not protected humanity out of love.

They had used the energy of human feeling — prayer, hope, despair, love, fear — to sustain themselves. Every feeling flowed up into the heavens.

The gods had not saved humanity. They had managed it.

Rael trembled as he read.

The light he had believed in was not whole.

His teacher, the heavens, the god — all of them had carried a lie.

For the first time, Rael did not pray.

That day one of his wings turned black.`,
  },
  {
    number: 4,
    title: "Broken Wing",
    body: `The more Rael tried to save people, the more his faith shook.

Fighting the rift, he came to a choice.

On one side, hundreds of citizens.
On the other, the central altar that could close the rift.

Save the citizens, and the rift would grow.
Hold the altar, and they would die.

Rael saved the citizens.

The rift spread to the whole city.

Many died.

The survivors blamed him.

"If you hadn't saved us, perhaps more would have lived."

For the first time Rael understood.

A good choice does not always produce a good outcome.

He held his sword all night in a ruined cathedral.`,
  },
  {
    number: 5,
    title: "Angel and Demon, Talking",
    body: `Rael clashed with Kael head-on.

They fought in the ruins. Light and abyss collided. Fallen bell towers were thrown back into the sky.

But at the end of the fight, Kael did not kill him.

He said,

"You don't love humans. You love the humans you want to believe in."

Rael raised his sword again.

"Then you only ever see their ugliness and think you understand them."

Kael answered,

"No. I'm saying their ugliness is part of being human."

After that day, Rael could no longer see Kael as merely an enemy.

He was a demon. But he did not lie.`,
  },
  {
    number: 6,
    title: "The Witch's Sight",
    body: `Luna helped Rael uncover his sealed memory.

In it he witnessed the final moment of the heavens' fall.

The heavens had not been destroyed by the rift.

The heavens made the rift first.

To pull more strength out of human feeling, the gods had built engines that amplified human sorrow and human desire. The engines went into runaway. From them, the Astra Rift was born.

The rift was not only humanity's sin.

It was the disaster the heavens' greed had made.

Rael fell to his knees.

The sacred order he had been defending had been built on sin from the start.

Luna said to him,

"Faith may collapse. But the choices you made don't disappear with it."`,
  },
  {
    number: 7,
    title: "A Sword to Kill a God",
    body: `Rael made for the broken Sun Palace at the heart of the heavens.

There the remains of a god still lingered.

Astrion, god of light.

He had lost his body, but he sustained himself by feeding on human prayer and feeling.

Astrion spoke.

"I did not rule humanity. Humanity made its own pain. I only gave that pain an order."

Rael asked,

"Was there love in that order?"

The god did not answer.

Rael raised his sword.

But to kill the god was to extinguish the last light of the heavens.

In that moment, the world might fall into total dark.`,
  },
  {
    number: 8,
    title: "The One Who Will Not Give Up",
    body: `Rael did not kill the god.

Instead he tried to return the god's authority to humanity.

Astrion was furious.

"They cannot bear it. They will war again, betray again, weep again."

Rael answered,

"Even so — the right to choose belongs to them."

Astrion burned away Rael's wings.

Rael fell.

He was no longer a complete angel.
But for the first time he rose on his own will.

He took up the sword not on a god's order, but because he believed in human possibility.

His light was weaker than before.

But it was far warmer.`,
  },
  {
    number: 9,
    title: "Salvation Without Light",
    body: `Wingless, Rael walked among humans.

No one recognized him as an angel anymore.
He could no longer work miracles, no longer descend from the sky.

But he helped them, one by one.

He sat beside weeping children. He held the hand of a dying soldier. To a woman who could not put down her revenge, he said quietly,

"Forgiveness is not a duty. But I do not want you to be trapped in that moment forever."

Rael understood.

Salvation is not a light coming down from above.

It is staying at someone's side to the end.

At last, he began to understand humans not as an angel, but as one being among them.`,
  },
  {
    number: 10,
    title: "The Last Prayer",
    body: `Rael went into final battle with Astrion.

Kael held the rift with the strength of the abyss. Luna returned the discarded feelings to humanity. Rael walked toward the remnant of the god.

Astrion offered one last bargain.

"Join with me, and the heavens open again. Humanity will be managed, and the world will be stable."

Rael shook his head.

"A stable prison is not salvation."

He drove his sword into the god's heart.

Light exploded.

But the world did not sink into dark.

Every prayer and every hope bound to the god returned to the humans who had made them.

Rael knelt and offered one last prayer.

Not to a god — to humanity.

"Please. Do not give up on yourselves."

When Rael's chapters end, the player receives the Rune of the Sun.`,
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// All characters
// ═════════════════════════════════════════════════════════════════════════════

export const CHARACTER_STORIES_EN: Record<CharacterId, StoryChapter[]> = {
  child: childChaptersEn,
  witch: witchChaptersEn,
  sage:  sageChaptersEn,
  shaman:   [],
  taoist:   [],
  dokkaebi: [],
  god:        [],
  hunter:     [],
  runeshaman: [],
};

// ═════════════════════════════════════════════════════════════════════════════
// World truth route + final chapter
// ═════════════════════════════════════════════════════════════════════════════

export const WORLD_LORE_EN: Partial<Record<
  CharacterCategory,
  {
    truthRoute: WorldTruthRoute;
    finalChapter: WorldFinalChapter;
  }
>> = {
  이세계: {
    truthRoute: {
      title: "Truth Route",
      unlockHint: "Unlocked when you have collected the Rune of the Abyss, the Rune of the Moon, and the Rune of the Sun.",
      body: `Kael's Rune of the Abyss.
Luna's Rune of the Moon.
Rael's Rune of the Sun.

When the three runes come together, the player sees the hidden final record.

The Astra Rift is no simple disaster.

It is the question the world is asking humanity.

"Can you carry your feelings — and still not destroy each other?"

Kael made humanity admit its desire.
Luna made humanity face its feeling.
Rael made humanity choose its own salvation.

No single one of the three can save the world.

Desire alone, and the world rots.
Suppressed feeling alone, and the world dies.
Hope alone, and reality is ignored.

When the three powers find balance, the rift does not close.

It becomes a door.

A door through which humanity may cross to the next world.`,
    },
    finalChapter: {
      title: "ASTRA RIFT",
      body: `The sky splits open completely.

Velmoras, king of the abyss; the emotions of the moon; the remains of the dead god Astrion — they merge, and a great being is born.

It has no name.

It is the gathering of everything humanity has thrown away.

Rage.
Desire.
Prayer.
Regret.
Love.
Loss.
Lies.
Hope.

Kael says,

"That isn't a monster. It's us."

Luna nods.

"The hearts we turned away from have come back."

Rael takes up his sword.

"Then we don't kill it. We meet it."

The final battle is a battle and a rite at once.

The player must connect the choices of all three.

Kael accepts desire.
Luna gives back feeling.
Rael entrusts hope to humanity.

In the last moment, a child's voice comes from inside the rift.

"You will still live?"

The three answer together.

"We will."

The rift does not close.

Instead it becomes a great constellation in the night sky.

People no longer call the rift a disaster.

It is a wound and a memory —
a vow that we will not look away again.`,
      ending: `"The world did not become perfect.
People still desire, still weep, still hurt, still regret.
But now they know.
Salvation is not the erasure of the dark —
it is refusing to let go of one another inside it."`,
    },
  },
};
