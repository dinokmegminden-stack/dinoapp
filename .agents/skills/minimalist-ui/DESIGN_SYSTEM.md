# DinoApp Landing Page — Minimalist-UI Design System

## 1. Color Palette (Warm Monochrome + Semantic Accents)

### Canvas & Surfaces
```
Canvas Background:     #FBFBFA (warm bone-white)
Primary Surface:       #FFFFFF (cards, sections)
Secondary Surface:     #F9F9F8 (subtle contrast)
Tertiary Surface:      #F3F3F1 (muted backgrounds)
```

### Text & Structural
```
Primary Text:          #2F3437 (warm charcoal, not pure black)
Secondary Text:        #787774 (muted gray for captions)
Tertiary Text:         #A9A6A2 (faint, hints only)
Divider:               #EAEAEA (ultra-light, 1px solid only)
Border:                #E5E2DE (slightly warmer than divider)
```

### Semantic Accent Colors (Desaturated Pastels)
```
Pale Amber:            #FBF3DB (background) / #956400 (text)
Pale Teal:             #E1F3EE (background) / #1F6C5D (text)
Pale Red:              #FDEBEC (background) / #9F2F2D (text)
Pale Blue:             #E1F3FE (background) / #1F6C9F (text)
Pale Green:            #EDF3EC (background) / #346538 (text)
```

### Interactive Elements
```
Button Primary:        #111111 (solid black) → hover: #333333
Button Ghost:          transparent → border: #EAEAEA → hover: background #F9F9F8
Link Text:             #2F3437 (inherit body) + underline #EAEAEA
Focus Ring:            #2F3437 @ 2px outline
```

---

## 2. Typography System

### Font Stack
```
Editorial Headings (H1–H2):
  font-family: 'Lyon Text', 'Newsreader', 'Instrument Serif', 'Playfair Display', serif
  (Backup: serif system fonts)

Body & UI Text:
  font-family: 'Geist Sans', 'SF Pro Display', '-apple-system', 'Helvetica Neue', sans-serif

Monospace (Code, Metadata):
  font-family: 'Geist Mono', 'SF Mono', 'JetBrains Mono', monospace
```

### Scale & Hierarchy
```
H1 (Hero Title):
  - Size: 48–56px
  - Weight: 400 (regular serif)
  - Line-height: 1.1
  - Letter-spacing: -0.03em (tight)
  - Color: #2F3437
  
H2 (Section Heading):
  - Size: 32–40px
  - Weight: 400 (serif)
  - Line-height: 1.15
  - Letter-spacing: -0.02em
  - Color: #2F3437

H3 (Subsection):
  - Size: 24px
  - Weight: 500 (sans-serif)
  - Line-height: 1.2
  - Letter-spacing: 0
  - Color: #2F3437

Body Text:
  - Size: 16px
  - Weight: 400
  - Line-height: 1.6
  - Letter-spacing: 0
  - Color: #2F3437

Small Text / Caption:
  - Size: 14px
  - Weight: 400
  - Line-height: 1.5
  - Color: #787774

Label / UI Text:
  - Size: 14px
  - Weight: 500
  - Line-height: 1.4
  - Letter-spacing: 0.01em
  - Color: #2F3437
```

---

## 3. Component Specifications

### Cards
```
Structure:
  - Background: #FFFFFF
  - Border: 1px solid #EAEAEA
  - Border-radius: 8px (crisp, never 12px+)
  - Padding: 24px or 32px (generous internal spacing)
  - Shadow: none (or ultra-soft: 0 1px 3px rgba(0,0,0,0.04))

Hover State:
  - Shadow: 0 2px 8px rgba(0,0,0,0.04) (over 200ms)
  - Transform: translateY(-1px) (subtle lift)
```

### Buttons
```
Primary CTA:
  - Background: #111111
  - Text: #FFFFFF
  - Padding: 12px 24px
  - Border-radius: 4px
  - Border: none
  - Font-weight: 500
  - Font-size: 14–16px
  - Cursor: pointer
  - Hover: background #333333 (200ms transition)
  - Active: scale(0.98)
  - Focus: 2px solid #2F3437 outline (outlineOffset: 2px)

Secondary (Ghost):
  - Background: transparent
  - Border: 1px solid #EAEAEA
  - Text: #2F3437
  - Padding: 11px 23px
  - Border-radius: 4px
  - Hover: background #F9F9F8
  - Active: scale(0.98)

Disabled:
  - Opacity: 0.5
  - Cursor: not-allowed
  - No hover effect
```

### Dividers / Separators
```
- Border: 1px solid #EAEAEA
- Never use color borders or double lines
- Margin: 24px 0 or 32px 0 (macro whitespace)
- No shadow or gradient
```

### Tags / Badges
```
Structure:
  - Border-radius: 9999px (true pill)
  - Font-size: 12px
  - Font-weight: 500
  - Padding: 4px 12px
  - Letter-spacing: 0.05em (wide, uppercase text)
  - Text-transform: uppercase

Example (Amber tag):
  - Background: #FBF3DB
  - Text: #956400
  - Border: none
```

### Input Fields
```
Structure:
  - Background: #F9F9F8
  - Border: 1px solid #EAEAEA
  - Border-radius: 4px
  - Padding: 12px 16px
  - Font: 16px sans-serif body
  - Color: #2F3437
  - Placeholder: #A9A6A2

Focus:
  - Border: 1px solid #2F3437
  - Outline: 2px solid #2F3437 (outlineOffset: 2px)
  - Background: #FFFFFF

Disabled:
  - Background: #F3F3F1
  - Color: #A9A6A2
  - Cursor: not-allowed
```

### Keystroke Display
```
<kbd> rendering:
  - Border: 1px solid #EAEAEA
  - Border-radius: 4px
  - Background: #F7F6F3
  - Padding: 2px 6px
  - Font: monospace, 12px
  - Color: #2F3437
  - Shadow: none
```

---

## 4. Layout & Grid System

### Page Structure
```
Max-width: 1200px (content)
Margin: 0 auto

Vertical Rhythm (Section Spacing):
  - Top-level sections: padding-top 64px, padding-bottom 64px
  - Subsections: padding 32px
  - Component gaps: 16px or 24px

Horizontal Margins (Responsive):
  - Desktop (≥1200px): 40px
  - Tablet (768–1199px): 32px
  - Mobile (<768px): 20px
```

### Bento Grid Layout
```
Main Grid (Hero + Features):
  - display: grid
  - grid-template-columns: repeat(3, 1fr) [desktop]
  - grid-template-columns: repeat(2, 1fr) [tablet]
  - grid-template-columns: 1fr [mobile]
  - gap: 24px
  - padding: 0 40px [desktop], 0 32px [tablet], 0 20px [mobile]

Feature Grid (Asymmetrical):
  - Hero/Feature cards can span: grid-column: span 2 (wider showcase)
  - Regular cards: grid-column: span 1
  - Ensure visual balance, not strict symmetry
```

### Typography Container (Editorial Content)
```
For long-form text, testimonials, or detailed sections:
  - max-width: 720px (narrow for readability)
  - margin: 0 auto
  - Apply H2/H3 + body scale as defined
```

---

## 5. Imagery & Background Treatment

### Photography
- Use desaturated, warm-toned images
- Apply subtle grain overlay: `background-image: url(grain.png); opacity: 0.04`
- Never use oversaturated stock photos
- Target: high-quality, editorial feel

### Hero Background
- Subtle radial gradient (warm tones, opacity: 0.02–0.03)
- Minimal geometric line pattern at very low opacity
- No bright gradients, no neon

### Icon System
- Use Phosphor Icons (Bold or Fill weights) or Radix UI Icons
- Custom SVG icons: monochromatic, geometrically precise
- Stroke width: 1.5–2px (consistent across all icons)
- Color: #2F3437 or semantic color if needed

---

## 6. Copywriting Guidelines

### Banned Phrases (Remove These)
```
❌ "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changer"
❌ "Delve into", "Harness", "Leverage", "Unlock potential"
❌ "Empower", "Transform", "Revolutionary", "Cutting-edge"
❌ "Discover the magic", "Join thousands of satisfied"
❌ All emojis and casual tone in headings
```

### Target Tone
- **Specific & Direct:** Name what it does, not what it claims.
- **Human:** Conversational but not casual; knowledgeable but not jargony.
- **Humble:** Focus on utility, not marketing hype.
- **Contextual:** Use domain language (e.g., "dinosaur species" not "dino creatures").

### Examples
```
❌ "Unleash your dinosaur discovery journey."
✅ "Explore 111 dinosaur species across 6 continents."

❌ "Next-gen interactive card game."
✅ "Match dinosaur pairs. Beat your time."

❌ "Seamlessly track your progress."
✅ "Track which species you've unlocked."

❌ "Elevate your knowledge."
✅ "Learn through games and quizzes."
```

---

## 7. Motion & Animation

### Scroll Entry (IntersectionObserver-driven)
```css
opacity: 0;
transform: translateY(12px);
animation: fadeInUp 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Staggered Grid Reveal
```css
animation-delay: calc(var(--index) * 80ms);
/* Apply to each grid item for cascade effect */
```

### Hover Lift (Cards)
```css
transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
transform: translateY(0);
box-shadow: 0 0 0 rgba(0,0,0,0);

:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
```

### Button Press (Active)
```css
transform: scale(0.98);
/* Duration: 100ms linear */
```

---

## 8. Responsive Breakpoints

```
Mobile:   < 768px  (single column, generous padding)
Tablet:   768–1199px (2-column grids, medium padding)
Desktop:  ≥ 1200px (3-column grids, full width)

All typography scales down on mobile (H1: 48px → 32px, body: 16px → 15px)
No horizontal scrolling; all content reflows vertically.
```

---

## 9. Accessibility & Focus States

```
Focus Ring: 2px solid #2F3437 outline (outlineOffset: 2px)
Applied to: buttons, inputs, interactive elements
High contrast: #2F3437 on #FFFFFF = 19:1 WCAG AAA

No emoji in alt text. Use descriptive, concise alt:
  ❌ alt="🦕"
  ✅ alt="Struthiomimus dinosaur illustration"

Skip links & keyboard navigation fully supported.
Proper heading hierarchy (H1 → H2 → H3, never skip levels).
```

---

## Summary of Key Differences from Current Design

| Aspect | Current | Minimalist-UI |
|--------|---------|---------------|
| Background | Navy #001219 | Warm bone-white #FBFBFA |
| Text | Roboto (generic) | Geist Sans (geometric) + serif for headings |
| Headings | Sans-serif | Serif (Lyon, Newsreader) with tight tracking |
| Borders | Thick, colored | 1px solid #EAEAEA (universal) |
| Shadows | Heavy (shadow-md, shadow-lg) | None or ultra-soft (< 0.05 opacity) |
| Buttons | Rounded pills | Crisp 4–6px corners |
| Icons | Lucide generic | Phosphor or custom SVG |
| Accents | Teal, amber bright | Desaturated pastels only |
| Layout | Scattered sections | Bento grid, macro whitespace |
| Copy Tone | Energetic, clichéd | Direct, specific, human |

---

## Implementation Notes

1. **Phase 1:** Update theme.js with new color tokens and typography scale.
2. **Phase 2:** Refactor landing components (HeroTop, DailyDinoCard, etc.) to use bento grids.
3. **Phase 3:** Replace all rounded-full buttons, remove heavy shadows.
4. **Phase 4:** Rewrite all marketing copy and remove emoji.
5. **Phase 5:** Integrate Phosphor icons and custom SVG elements.
6. **Phase 6:** Add IntersectionObserver scroll animations.
7. **Phase 7:** Test responsive breakpoints and accessibility.
