# Copy Rewrite Guide — DinoApp Landing Page

Transform marketing language into direct, specific, human communication.

---

## Current Copy → Minimalist-UI Copy

### Hero Section

**Current:**
> "Felfedezz fel 111 őslényt 6 kontinensről. Empower your dino journey."

**Minimalist:**
> "Explore 111 dinosaur species from 6 continents."
> (No emojis, no power words, no preamble.)

---

### Game Modes (Primary CTAs)

**Current:**
> "PÁROK" / "Ki vagyok én?" / "5MP KÉPKVÍZ" / "XP MILLIOMOS" / "DÍNÓFUTAM" / "AKASZTÓFA"
> (All-caps labels feel shouted. Add descriptive subtitles.)

**Minimalist:**
> **Memory Match**
> Find matching dino pairs. 3 difficulty levels.
>
> **Who am I?**
> Answer 10 questions. Guess the species.
>
> **Snapshot Quiz**
> 10 images, 5 seconds each. No retake.
>
> **Trivia Ladder**
> 15 questions, increasing difficulty. One wrong ends the round.
>
> **Dino Run**
> Dodge obstacles, collect food. Track your speed.
>
> **Hangman**
> Guess the dinosaur name. Limited wrong guesses.

(Lowercase, direct, benefit-focused.)

---

### Regions Section

**Current:**
> "RÉGIÓK" (isolated label, no context)

**Minimalist:**
> **Explore by continent**
> 6 regions, each with locked species. Unlock through games.
>
> (Explains what the map does, sets expectation.)

---

### Daily Dino Card

**Current:**
> "🦕 NAPI DÍNÓ" / "Koppints a tényért ↻"

**Minimalist:**
> **Today's creature**
> [Dinosaur image]
> Flip to read a fact.
>
> (Emoji removed. Purpose clear. Interaction obvious.)

---

### Collection / Progress

**Current:**
> "GYŰJTEMÉNY" / "Unlock cards" / "View timeline"

**Minimalist:**
> **Your collection**
> 34 species collected
> [Progress bar]
> View all | Timeline view
>
> (Specific number. Clear actions, no jargon.)

---

### Leaderboard / Achievements

**Current:**
> "RANGLISTA" / "Top players" / "Your rank"

**Minimalist:**
> **Leaderboards**
> See how you rank. Filter by game and time period.
>
> (Direct purpose, no marketing spin.)

---

## Banned Phrases & Replacements

| Banned | Replacement | Reason |
|--------|-------------|--------|
| "Unleash" | "Play", "Start", "Try" | More direct |
| "Seamless" | "Smooth", or just delete | Vague promise |
| "Empower" | "Help you", "Let you", "Enable" | More human |
| "Next-gen" | Remove entirely | Meaningless hype |
| "Dive in" / "Delve" | "Explore", "Discover", "Learn" | Specificity |
| "Game-changer" | Describe what actually changed | Concrete examples |
| "Elevate" | "Improve", "Better", or context-specific | Avoid abstract |
| "Harness" | "Use", "Leverage" → "Use" | Simpler |
| "Unlock potential" | "Improve your score", "Learn more" | Measurable |

---

## Emoji Removal Protocol

**Current state:** Emojis used as decorative text prefixes.
- ❌ "🦕 NAPI DÍNÓ"
- ❌ "🎮 JÁTÉKOK"
- ❌ "🏆 RANGLISTA"

**Minimalist state:** Replace with text labels or icons only.
- ✅ "Today's creature" (with Phosphor icon if needed)
- ✅ "Game modes" (with Phosphor icon if needed)
- ✅ "Leaderboards" (with Phosphor icon if needed)

**Rule:** Emojis are banned from code, headings, labels, and alt text. Use proper icons or plain text only.

---

## Tone Voice Table

Apply this tone across ALL copy:

| Quality | Do | Don't |
|---------|----|----|
| **Specificity** | "Match 10 pairs in 30 seconds" | "Challenge yourself" |
| **Directness** | "Start a game" | "Unleash your gaming potential" |
| **Honesty** | "Learn while you play" | "Seamless learning experience" |
| **Simplicity** | "You earn XP for correct answers" | "Harness the power of achievement metrics" |
| **Humanity** | "Play at your own pace" | "Optimize your experience" |
| **Concreteness** | "Unlock 5 new dinosaurs" | "Discover endless possibilities" |

---

## Implementation Checklist

- [ ] Remove all emojis from UI text, headings, labels, alt text
- [ ] Rewrite all CTA button labels to be action-first (verb + object)
- [ ] Remove marketing clichés from section headers
- [ ] Add one-line descriptive subtitle to each game mode
- [ ] Update region labels with benefit statement
- [ ] Simplify placeholder text in input fields
- [ ] Review all alt text for concrete, emoji-free descriptions
- [ ] Check all button hover/tooltip text for clichés
- [ ] Audit leaderboard labels and achievement names

---

## Example: Full Landing Page Copy Transformation

### Current Version (Problem State)
```
🦕 DÍNÓ LEXIKON
Fedezz fel 111 őslényt 6 kontinensről. 
Elevate your dino journey.

▶ KEZDD A KALANDOT!

🦕 NAPI DÍNÓ
[Dinosaur image]
Koppints a tényért ↻

RÉGIÓK
[World map]
Kárpát-medence, Európa, Afrika, Ázsia, Dél-Amerika, Észak-Amerika

🎮 JÁTÉKOK
[Grid of game mode buttons]
PÁROK | KI VAGYOK ÉN? | 5MP KÉPKVÍZ | etc.
```

### Minimalist Version (Target State)
```
DINO LEXICON
Explore 111 dinosaur species across 6 continents through games and quizzes.

Start exploring

Today's creature
[Dinosaur image]
Flip to read a fact.

Explore by continent
[World map with region counts]
Unlock species by playing games in each region.

Game modes
[Clean bento grid, each card labeled:]
Memory match | Who am I? | Snapshot quiz | Trivia ladder | Dino run | Hangman
[One-line description under each]
```

---

## Notes

- **Length:** Shorter is better. One clear sentence > flowery paragraph.
- **Capitalization:** Sentence case always (except proper nouns: DinoApp, Struthiomimus).
- **Punctuation:** End statements with periods. No exclamation marks on routine actions.
- **Numbers:** Specific counts (111, 6, 10) are good. Vague ("many", "endless") is bad.
- **Audience:** Assume user is familiar with games. Don't over-explain basic concepts.
