# Manual QA Checklist — Landing Page

Scope: `src/screens/LandingPage.js` and everything it renders — `HeroTop.js`,
`PrimaryCTA.js`, `DailyDinoCard.js` (+ `utils/dailyDino.js`), `LandingMenu.js` +
`RegionWorldMap.js`, `CreatureMarquee.js`, `Shell.js`, `AppInfoModal.js`.

How to run this: open the app via the Expo web dev server for the browser-driven
checks (resize the browser window for the breakpoint checks); use an Expo Go /
simulator pass for the native-only checks. No automated tests exist for this
screen (by design, per project convention) — this checklist is the verification
method.

Legend: **[WEB]** web-only, **[NATIVE]** native-only, **[BOTH]** check on both.

---

## 0. Smoke test (run this subset before every deploy)

1. **[BOTH]** Load the landing page fresh (cold start, cleared cache/AsyncStorage if possible). Expected: page renders without crash, header icons visible, hero title "DÍNÓLEXIKON" visible, CTA button visible, Daily Dino card visible (loading or populated), region map visible with 6 markers, bottom marquee scrolling.
2. **[BOTH]** Tap/click "Kezdd a felfedezést!" (PrimaryCTA). Expected: navigates into a region/pack (the next unlocked pack, or region 1 pack 1 for a brand-new player).
3. **[BOTH]** Tap/click each of the 6 region markers on the map once. Expected: each opens the correct region (see section 5 for the edu→continent mapping) — no marker opens the wrong region.
4. **[WEB]** Resize the browser from 320px to 1440px width slowly. Expected: no layout break, no horizontal scrollbar, no overlapping elements at 700px and 1024px.
5. **[BOTH]** Click the trophy, collection, account, YouTube, and info header icons once each. Expected: each opens its target (leaderboard / gallery / dashboard / YouTube tab / info modal) without error.
6. **[BOTH]** Watch the bottom marquee for one full loop (roughly names-width / 45px-per-sec). Expected: no visible jump, stutter, or blank gap where it restarts.

---

## 1. Header bar

1. XP pill shows a number followed by "XP" on load. Play any game mode, earn XP, return to landing. Expected: the pill updates to the new total within ~500ms (it polls `getTotalXP()` every 500ms) without requiring a manual refresh.
2. "Játékok" button: hover **[WEB]** shows a darker background (`accentDark`); click opens the Gaming/mode-select screen.
3. Trophy icon opens the Leaderboard screen.
4. Collection icon shows a small orange "%" badge in its top-left corner. Verify the percentage matches the player's actual unlocked-card ratio (cross-check against the Gyűjtemény screen's own completion display, or a fresh account showing 0%). Click opens the Gallery/collection screen.
5. Account icon: **[WEB]** hover shows a tooltip bubble below-right with the player's nickname, no truncation/wrapping for a typical nickname length; a very long generated nickname (famous-dino-genus + number) should not overflow past the header bar edge or break layout — check `numberOfLines={1}` is actually clipping instead of wrapping. Click opens the player dashboard.
6. Vertical divider renders between the primary icon group (trophy/collection/account) and the secondary group (YouTube/info) — confirm it's visible against the header background at both mobile and wide-web widths.
7. YouTube icon (secondary, smaller/dimmer) opens `https://www.youtube.com/@dinokmegminden` in a new tab **[WEB]** or the device browser/YouTube app **[NATIVE]**.
8. Info icon opens `AppInfoModal` (see section 9).
9. **[WEB]** Tab through the header via keyboard only (no mouse). Expected: every icon button (Játékok, trophy, collection, account, YouTube, info) receives a visible focus ring (`outlineColor: accent` for primary, same style for secondary) in a sensible left-to-right order; Enter/Space activates the focused button.
10. **[WEB]** Hover each secondary icon (YouTube, info) and confirm its tooltip text ("YouTube", "Mi ez az app?") appears; hover the primary icons that have no tooltip prop (Játékok, trophy, collection) and confirm nothing appears (only the account icon has a tooltip among the primary group).
11. Rapid repeated clicks on the collection/trophy/account icons (double-click, triple-click) do not open the target screen multiple times stacked, and do not desync the hover/focus/pressed visual states (e.g. icon stuck in "pressed" scale-down after release).

## 2. Hero (`HeroTop.js`)

1. Title reads exactly "DÍNÓLEXIKON" as a single word — confirm it does NOT wrap onto two lines at the narrowest supported width (320px). Since it's one unbroken word with no manual line break, check it doesn't get clipped or overflow the yellow accent bar's row instead of wrapping ugly.
2. **[WEB]** Resize the window continuously from 320px to 1440px and watch the title font size. It's computed as `clamp(28, width*0.07, 38)` — confirm it never exceeds 38px (check around ~543px width where `width*0.07` first hits 38) and never drops below 28px (check below ~400px width).
3. At the largest title size (38px, wide desktop), confirm the yellow vertical accent bar to the left stays vertically centered/stretched against the (now taller) two-line-capable text column and doesn't look mismatched in height.
4. **[WEB]** Hover over the title/logo row. Expected: a subtitle overlay appears below the title reading "Fedezz fel {N} őslényt 6 kontinensről" where N is the live creature count; it must float without shifting the CTA button or Daily Dino card below (it's `position: absolute`). Move the mouse away — overlay disappears cleanly, no flicker.
5. Confirm the hover subtitle's creature count N matches `allDinos.length` once data has loaded (should read 111 with the current dataset, per `data/111 db.csv`) — not the fallback constant, once real data is in.
6. Before `allDinos` loads (throttle network — see section 8), hover the title and confirm the subtitle falls back to showing 111 rather than 0 or "undefined".
7. **[NATIVE]** On a touch device there is no hover state — confirm the subtitle is simply never shown (acceptable; it's a web-only affordance) and that tapping the title/logo row doesn't error out or navigate anywhere unexpected (the Pressable has no onPress).
8. Confirm the title text color/shadow stays legible against both the gradient background (mobile) and the background photo + dark overlay (wide-web) — check especially over the lightest part of the background image.
9. Title font: once Caprasimo is loaded, the title should render in Caprasimo, not System — compare against a screenshot/known-good reference, or check for a brief flash of the fallback System font on a slow/cold load before Caprasimo finishes loading.

## 3. Primary CTA (`PrimaryCTA.js`)

1. Button reads "Kezdd a felfedezést!" with a play icon, full width of its column.
2. A soft yellow glow pulses behind the button (opacity 0.35↔0.9, slight scale 1↔1.04) on a slow ~2.2s cycle (1100ms up + 1100ms down). Confirm it's a smooth breathing effect, not jarring or flickering.
3. Click/tap the button as a brand-new player (no progress). Expected: navigates to region 1 ("Kárpát-medence"), pack 1 (per `findNextPack`'s default).
4. Click/tap the button as a returning player with partial progress in one region. Expected: navigates to that player's actual next unlocked pack (per `findNextPack`), not always region 1.
5. Click/tap the button as a player who has 100%-completed every region. Expected: does not crash — confirm what `findNextPack` returns in this edge case (falls back to region 1) and that landing on region 1 pack 1 again is graceful, not an error screen.
6. **Reduced motion:** enable "Reduce Motion" in OS accessibility settings **[NATIVE: iOS Settings > Accessibility > Motion, Android Settings > Accessibility > Remove animations; WEB: OS-level prefers-reduced-motion, e.g. Windows Settings > Ease of Access > Display > Show animations]**, then reload the landing page. Expected: the glow does NOT pulse at all (stays static) — confirm via `AccessibilityInfo.isReduceMotionEnabled()` gating in code, verify visually.
7. Toggle reduced-motion mid-session (if platform allows) — the existing glow loop that already started should keep running until next mount (this is checked once on mount, not reactively) — confirm this doesn't look broken, just note it doesn't live-update.
8. Confirm the glow is `pointerEvents="none"` — clicking exactly on the glow area outside the button's visible bounds should not trigger navigation (no invisible oversized hit target).
9. Press and hold (native) / mousedown without release (web) on the button — confirm the pressed/shadow visual state from `PressableButton` looks correct and doesn't fire onPress until release-inside.

## 4. Daily Dino card (`DailyDinoCard.js`)

1. On first load with data available, the card front shows: a creature image, a Hungarian common name band, and (if available) a latin name under it, plus "Koppints a tényért ↻" hint.
2. Tap/click the card. Expected: a 450ms 3D flip animation to the back face, showing "TUDTAD?" label, a one-sentence fact (first sentence of `description_hu`), a "Tudj meg többet →" button, and "Koppints vissza ↻" hint.
3. Tap the card again (not the "Tudj meg többet" button, elsewhere on the card). Expected: flips back to the front.
4. Tap "Tudj meg többet →" specifically. Expected: navigates directly into that creature's region (via `onEnterRegion(dino.edu)`) — confirm it does NOT also trigger the card's own flip-back tap handler (check for the Pressable inside a Pressable not double-firing / not requiring two taps).
5. **Determinism:** reload the page multiple times within the same calendar day (same device, same timezone). Expected: the same creature appears every time (seeded by day-of-year, not random per load).
6. **Date-rollover:** if feasible, check behavior right around local midnight (or temporarily change the device clock, then restore it) — confirm the picked creature changes the next day and doesn't crash on the boundary. Note: uses local device time, not server time — flag this only as an observation, not necessarily a bug.
7. If `dino.description_hu` has no sentence-ending punctuation at all, confirm the fallback (`text.trim()` of the whole string) doesn't overflow the fixed-height back face ungracefully — spot-check a couple of creatures with unusually long descriptions.
8. If a creature's image is missing from `IMAGE_MAP`, confirm the `MISSING_IMAGE` placeholder renders instead of a broken image icon or crash.
9. **Font-discipline check (flag if failing):** per project convention, scientific/latin names must render in `Cinzel_700Bold`. Inspect the latin name on the card front — current code applies `boldFont` (`Fredoka_600SemiBold`), not Cinzel. Confirm with the design owner whether this is an intentional exception for this card or a discipline violation to fix.
10. **[WEB]** In wide-desktop mode, the card stretches (`flex: 1`) to fill the remaining height of the left column down to the Daily Dino card's natural bottom — confirm the 16:9 aspect ratio (`aspectRatio: 16/9`) is preserved and the card doesn't get squashed or stretched out of proportion by the wide-column flex behavior.
11. Loading state (no `allDinos` yet, or empty array): confirm "Napi dínó betöltése…" placeholder shows at the correct 16:9 aspect box, not a layout jump when data arrives.
12. Sound: tapping "Tudj meg többet →" and the card flip itself — confirm neither the flip nor "Tudj meg többet" plays an unexpected sound while muted (only the resulting `onEnterRegion` navigation triggers `playSound('click')` from the parent's `handleDailyDinoPress`; the flip itself is silent by design — confirm that's actually true, no stray sound).

## 5. Region map (`RegionWorldMap.js` via `LandingMenu.js`)

1. "RÉGIÓK" section label renders above the map in accent color, uppercase.
2. Confirm all 6 numbered markers are visible and roughly overlaid on the correct continent on the map silhouette:
   - edu 6 "Észak-Amerika" — North America
   - edu 5 "Dél-Amerika" — South America
   - edu 2 "Európa" — Europe
   - edu 1 "Kárpát-medence" — Central Europe (near/inside the Europe marker, should read as visually distinct/nested, not overlapping edu 2's marker illegibly)
   - edu 3 "Afrika" — Africa
   - edu 4 "Ázsia" — Asia
3. Click/tap each marker one at a time and confirm the region opened matches the label under test (this is the highest-risk regression class — a mismatched `edu` value silently sends the player to the wrong region). Cross-check against the number displayed on the marker (species count) actually belonging to that region if you can compare with the Gyűjtemény/region screen afterward.
4. Confirm no dark/black backing panel or box remains behind the map (this was a recent fix — the map should read as a transparent-fill, orange-outlined silhouette directly over the page background, not sitting on a solid rectangle).
5. Confirm country borders are NOT visible within a continent (the `feMorphology` "close" filter should merge them into one silhouette) — only the outer coastline should have an orange outline. At `CLOSE_RADIUS = 1.2`, check known gap-prone areas (e.g. Central American isthmus, Southeast Asia archipelago, Scandinavia/mainland Europe join) for stray unfilled gaps or double-outlines.
6. **[WEB]** Hover each marker: expect (a) the number scales up (1.35x) and turns cream/white with an orange glow, (b) a tooltip with the region name appears above the marker, (c) the marker raises above siblings (no other marker/tooltip clipped behind it).
7. **[WEB]** Tab-focus each marker via keyboard: expect the same hover-equivalent visual (enlarged number + tooltip) plus a visible cream-colored focus outline ring; confirm focus order is logical (not visually jumping erratically across the map) and Enter/Space activates navigation.
8. **[WEB]** Mouse over one marker, then quickly move to an adjacent marker without leaving the map area in between. Expected: the first marker's hover/tooltip state cleans up correctly (no two tooltips shown simultaneously, no "stuck" hover state) — this exercises the `prev === m.edu` guard in `onHoverOut`.
9. Loading state: before `regionCounts` is populated (throttle network, see section 8), every marker shows "…" instead of a number or "0". Confirm no marker ever flashes "0" before the real count arrives (would misleadingly suggest an empty region) — it should go straight from "…" to the real count.
10. Once loaded, confirm each marker's number matches the actual creature count for that `edu` (cross-check against the region's own screen or Supabase data) and that the 6 numbers sum to the hero's "N őslényt" count.
11. **[WEB]** Resize the browser width; confirm the map's `aspectRatio` is preserved (no squashing) and marker positions (percentage-based) stay correctly anchored over their continents at every width, including exactly 700px and 1024px.
12. Rapid click-spam on a single marker — confirm it doesn't fire multiple navigations or leave the app in a broken state (e.g., double-mounted region screen).

## 6. Creature marquee (`CreatureMarquee.js`)

1. On load with data present, confirm the strip renders creature common names separated by a small orange ◆ dot, scrolling continuously right to left.
2. **Seamless loop:** watch closely through at least 2 full loop cycles (duration = sequence width ÷ 45px/sec — for ~111 names expect a loop of roughly 20–40s depending on rendered width; watch the wraparound point specifically). Expected: no visible jump, snap-back, gap, or flicker at the point where the animation resets from `-seqWidth` back to `0`.
3. **Empty/near-empty data:** with `allDinos` empty (throttle network to before data loads, or test on a fresh cold start before preload finishes). Expected: the marquee renders nothing at all (component returns `null`) rather than an empty scrolling strip or a strip stuck at width 0 mid-layout.
4. **Very few items** (if testable by temporarily filtering, or naturally on a region with few creatures — note the marquee always uses the FULL `allDinos` list, not a per-region subset, so this scenario is unlikely in practice, but verify: if it ever renders with say 2–3 names, confirm the loop still looks reasonable and doesn't stutter from an unnaturally short sequence width).
5. **Touch/scroll passthrough:** the strip is `pointerEvents="none"`. On a touch device, confirm swiping vertically or horizontally directly over the marquee strip still scrolls the underlying page normally (the marquee must not intercept touches) and that no name in the marquee is tappable/clickable.
6. **No unexpected re-shuffle:** trigger a re-render of the landing page without changing `allDinos` (e.g., earn XP so `XPPill`'s state updates every 500ms, causing `LandingPage` to re-render its subtree — confirm `CreatureMarquee` itself doesn't remount/reshuffle since `allDinos` is a stable reference via `useMemo`/App-level state). Expected: the marquee's name order and current scroll position are NOT reset or reshuffled just because XP changed elsewhere on the page. If you do observe a reshuffle/reset, that's a bug — `allDinos` reference stability should prevent it.
7. **CPU/performance:** leave the landing page open and idle for 5+ minutes (marquee looping continuously via `Animated.loop`) — on a lower-end device or **[WEB]** via the browser's performance/task manager, confirm CPU usage stays low and stable, no memory growth over time (leaking Animated listeners), and no frame-rate degradation in the rest of the page while it scrolls.
8. Navigate away from the landing page (open a region, a game mode, the gallery) and confirm the marquee's animation loop stops/cleans up (the `useEffect` cleanup calls `loop.stop()`) rather than continuing to run invisibly in the background.
9. **Reduced motion:** with OS reduce-motion enabled, note the marquee currently has NO reduced-motion gating (unlike PrimaryCTA's glow) — confirm this is a known/accepted gap or flag it as a discipline inconsistency worth fixing, since CLAUDE.md's reduced-motion expectation (per PrimaryCTA precedent) arguably should extend here too.
10. Confirm the marquee text uses Roboto (or the project's general UI font), not Cinzel — these are common names (`name_hu`), not scientific names, so Cinzel would be incorrect here.
11. **[WEB]** Resize the window while the marquee is mid-scroll. Confirm the sequence width re-measures (`onLayout`) and the loop duration/position adjusts sensibly rather than leaving stale timing that causes a visible jump or a strip that no longer tiles seamlessly at the new width.

## 7. Layout / responsive (Shell + breakpoints)

Test each of these widths specifically, not just "narrow/wide" in general: **320px, 375px, 699px, exactly 700px, 1023px, exactly 1024px, 1280px, 1440px+**.

1. **< 700px (mobile):** single column, `maxWidth: 520`, no background photo (Shell only shows it at web ≥700px), standard gradient background instead.
2. **700–1023px (tablet):** single column still, but `maxWidth: 680` with more horizontal padding (28px) — confirm content (map, cards) looks appropriately roomier than mobile, not just mobile content stretched with dead space. Background photo now visible (Shell's `isWideWeb` threshold is also 700).
3. **Exactly 700px:** confirm this lands in the tablet bucket (`isTablet = width >= 700 && width < 1024`) and the background image appears (Shell threshold `width >= 700`) — check for any 1px-boundary visual seam or double-transition artifact right at this width.
4. **≥1024px (wide):** two-column layout appears (`mainAreaWide`, `flexDirection: row`) — left column (hero/CTA/daily dino) at roughly 44% width (`flex: 11`), right column (region map) at roughly 56% (`flex: 14`); overall content `maxWidth: 1280` via `contentMaxWidth={isWide ? 1280 : undefined}` passed to Shell, which itself independently caps at 1100 in its own `innerWide` unless overridden — confirm the 1280 override actually takes effect (visually wider than 1100 at very large viewports) and doesn't get silently clamped back down by Shell.
5. **Exactly 1024px:** confirm this is the first pixel where two-column kicks in (`isWide = width >= 1024`) — check for a jarring reflow right at this boundary (one-column tablet layout should NOT still be showing at 1024px).
6. **Width-fill check (regression class per project history — this exact bug hit the Dínófutam track):** at every breakpoint, confirm the outermost `column` View and its children fill the available width rather than shrinking to intrinsic content size. Specifically check the region map and marquee strip span the full column width at 1024px+ and don't leave a large empty gap on the right (or center-shrink) inside their flex containers.
7. At very large widths (1920px+, ultra-wide monitor), confirm the capped `maxWidth` keeps content centered and readable rather than stretching the map/cards absurdly wide.
8. **[WEB]** With the background photo visible (≥700px), confirm the dark gradient overlay keeps text/icons legible across the whole vertical span of the page, including far down near the marquee at the bottom (not just near the hero at the top).
9. Rotate a tablet/phone device between portrait and landscape (native) or resize the web window across the 700/1024 boundaries repeatedly in quick succession — confirm no layout thrashing, stuck styles, or crash from rapid dimension changes.
10. Confirm the page is vertically scrollable end-to-end (header through marquee) at short viewport heights (e.g. a laptop in a small window, or a phone in landscape) without content being cut off or the ScrollView failing to reach the very bottom (marquee fully visible after scrolling).

## 8. Data loading & error states

Simulate via browser DevTools network throttling/offline mode **[WEB]**, or airplane mode / a proxy that blocks Supabase **[NATIVE]**. Also test a fresh cold start where the preload hasn't resolved yet (should be observable briefly even on a fast network).

1. **Before `allDinos` loads:** Hero creature count falls back to 111 (hardcoded `TOTAL_CREATURES_FALLBACK`) on hover of the title. Confirm this looks correct and not like "0" or blank.
2. **Before `allDinos` loads:** every region marker on the map shows "…" (not "0", not blank) per `countsLoading` logic.
3. **Before `allDinos` loads:** Daily Dino card shows the "Napi dínó betöltése…" placeholder, not a broken/blank card.
4. **Before `allDinos` loads:** marquee renders nothing (returns `null`) — confirm this doesn't leave a layout gap or broken border line where the strip would be.
5. **Total network failure for creature preload** (e.g., Supabase unreachable for the whole session): per `App.js`'s `preloadCreatures().catch(console.warn)`, a genuinely thrown error leaves `allDinos` as `[]` permanently (no retry, no visible user-facing error banner on the landing page itself). Confirm this is the actual current behavior: hero count stays at fallback 111 forever, all region markers stay on "…" forever, Daily Dino card stays on its loading placeholder forever, marquee stays empty forever — i.e., the page degrades to "perpetually loading" rather than crashing, but never recovers without a full app reload. Flag this to the team as a UX gap if a visible retry/error state is desired.
6. **Partial failure** (one `fetchCreaturesByEdu(edu)` call fails, others succeed — `creaturesService.js` catches Supabase errors per-call and returns `[]` for that edu rather than throwing): confirm the app doesn't crash, the hero count reflects only the successfully-loaded regions (will under-count), and the affected region's marker shows "0" (a real number, not "…", since `regionCounts` is populated overall) — this is a subtle case where "0" is technically correct (in code terms) but misleading to a real player (looks like an empty region rather than a failed load). Flag as a UX consideration.
7. **Slow network (throttled, not failing):** confirm all four "loading" states above show correctly and transition cleanly to populated states once data arrives, with no layout jump/flash worse than a simple content swap.
8. Test with a brand-new player (nickname just created, zero progress, zero XP): XP pill shows "0 XP", collection badge shows "0%", CTA leads to region 1 pack 1, no crashes from empty progress objects anywhere on the page.
9. Test with a player who has 100% completed all 6 regions: collection badge shows "100%", region markers all show their full counts, CTA (see section 3.5) still functions without error.

## 9. Info modal (`AppInfoModal.js`)

1. Click the info icon — modal fades in, centered, with a semi-transparent backdrop.
2. Modal body text is scrollable if it overflows the `maxHeight: 420` body box — confirm scrolling works smoothly and doesn't scroll the page behind it (Modal should be its own layer).
3. Click the backdrop (outside the sheet) — modal closes.
4. Click inside the sheet (on the text, not the close button) — modal stays open (confirms `e.stopPropagation()` on the inner Pressable works).
5. Click "Bezárás" — modal closes.
6. **[NATIVE]** Android hardware/gesture back button closes the modal (`onRequestClose`).
7. Reopen the modal multiple times in a row — confirm no stacking of multiple modal instances, no stale scroll position carried over oddly (each open should reasonably reset scroll to top).
8. Confirm the modal's title and close button use the project's actual bold font, not just the generic `FONTS.bold` = `'sans-serif'` alias — check this renders acceptably rather than looking like an unstyled system fallback.

## 10. Accessibility

1. **[WEB]** Full keyboard-only pass: Tab from the top of the page to the bottom (header icons → hero → CTA → daily dino card → region markers → marquee, which should NOT be focusable since it's non-interactive/`pointerEvents="none"`). Confirm every interactive element is reachable, has a visible focus indicator, and activates with Enter/Space.
2. Confirm focus order is logical (visual top-to-bottom, left-to-right) and doesn't jump erratically between the two columns in wide-desktop mode.
3. Region markers have `accessibilityRole="button"` and `accessibilityLabel` set to `"{region name} régió"` — verify with a screen reader **[NATIVE: VoiceOver/TalkBack, WEB: NVDA/VoiceOver+browser]** that each marker announces its region name clearly, not just a bare number.
4. Header icon buttons, CTA, and Daily Dino card: verify screen-reader announces something meaningful (not just "button" with no label) — if any icon-only button lacks an `accessibilityLabel`, flag it (spot-check the code: `RoundIconButton`/`CollectionIconButton`/`GamingButton` do not appear to set explicit `accessibilityLabel`/`accessibilityHint` props beyond the tooltip text, which is visual-only).
5. Color contrast: confirm the orange accent text (region marker numbers, section label) and cream text remain readable against both the plain gradient (mobile) and the photo+overlay background (wide-web) — check the lightest patches of the background photo specifically.
6. Reduced motion covered separately in sections 3.6 and 6.9 above — cross-reference both here as a single "reduced motion respected app-wide" pass.

## 11. Sound

Global mute is a module-level flag (`isSoundMuted` in `audioSystem.js`) toggled via `MuteButton`, which is NOT present on the Landing screen itself — it only appears inside game screens (Runner, Hangman, WhoAmI, Millionaire, Villámkvíz, Memory, PackageQuiz). To test muting on the landing page:

1. From the landing page, open any game screen that has the mute button (e.g., tap a region → a package quiz), tap the mute (🔊→🔇) icon there, then navigate back to the landing page.
2. With mute now active, click through every landing interaction that calls `playSound('click')`: Játékok button, trophy, collection, account, YouTube, info icons, region markers (`handleSelectRegion`), Daily Dino "Tudj meg többet" (`handleDailyDinoPress`), and the CTA (`handleStartAdventure`). Expected: silence on all of them.
3. Un-mute (return to the game screen, toggle back to 🔊), return to landing, repeat the same click-through. Expected: an audible click sound on each interaction.
4. Confirm mute state does NOT persist across a full app reload (it's an in-memory variable, not AsyncStorage-backed) — reload the app after muting and confirm sound is back on by default. If this is not the desired behavior, flag it as a product decision to revisit, not a bug per se.
5. Rapid repeated clicks on a sound-triggering element — confirm sounds don't overlap/garble badly (the `replayAsync()` reuse pattern in `playSound` should restart cleanly) and don't cause a crash.
6. **[NATIVE]** Confirm landing-page click sounds respect the device's silent/mute hardware switch and system volume as expected for `expo-av`.

## 12. Performance

1. Cold start to landing-page-interactive time is reasonable (no multi-second white/blank screen) even before Supabase data resolves — the loading states (sections 8.1–8.4) should appear promptly.
2. Scroll performance: with the marquee animating continuously, scroll the page up and down repeatedly (native flick-scroll and web mouse-wheel) — confirm no jank/frame drops caused by the concurrently running `Animated.loop` instances (PrimaryCTA glow + marquee, both looping simultaneously at all times on this screen).
3. Leave the landing page open in a background tab **[WEB]** for a few minutes, then refocus — confirm the marquee and CTA glow animations haven't drifted wildly out of sync with their intended timing or caused a runaway timer pile-up (browsers throttle background tab timers; check for a jarring "catch-up" jump on refocus).
4. Memory: navigate landing → region → back → landing repeatedly (10+ times) and watch for growing memory usage (leaking Animated values, uncanceled intervals from `XPPill`'s `setInterval`, or uncleaned marquee loops) via browser DevTools memory profiler **[WEB]** or Xcode/Android Studio profiler **[NATIVE]**.
5. Image loading: the background photo (`new_bg.jpg`) and Daily Dino creature images should not visibly pop in with a jarring flash/reflow after layout has already settled — check on a throttled connection.

## 13. Cross-platform

1. **[WEB - Chrome, Firefox, Safari, Edge]** Run the smoke test (section 0) in each major browser — pay particular attention to the SVG map rendering (feMorphology filters are a common cross-browser SVG-filter compatibility risk) and the `outlineStyle`/`outlineColor` focus-ring CSS (not universally supported the same way in older Safari).
2. **[NATIVE - iOS]** Run the smoke test on an iOS simulator/device — confirm hover-only affordances (hero subtitle, header tooltips) gracefully have no equivalent or an acceptable substitute (they simply don't appear, which is fine, per section 2.7), and that nothing depending on `onHoverIn`/`onHoverOut` breaks or throws on a touch-only platform.
3. **[NATIVE - Android]** Same as iOS, plus confirm the Android hardware/gesture back button behaves sensibly on the landing page (no unexpected app-exit or dead-end — e.g., does back close the info modal if open, as checked in 9.6, and otherwise do nothing destructive on the bare landing page).
4. Confirm the background photo (`Shell`'s `AnimatedLandingBg`) only appears on web ≥700px per the `isWideWeb` check — native app (any screen size) should never show it, always using the plain gradient instead. Explicitly verify on a large-screen native device (e.g., iPad) that native still gets the gradient, not the photo (since the `Platform.OS === 'web'` check should exclude it regardless of width).
5. Font loading (Caprasimo, Figtree, Fredoka via `expo-google-fonts`) should succeed identically on web and native — confirm no native-only font-loading failure silently falls back to `'System'` for the whole session (spot check by comparing rendered glyphs against a known Caprasimo reference).

---

## Known risk areas / things this checklist deliberately over-tests

- **Region marker → edu mapping (section 5.3)** — a wrong `edu` value here silently sends a player to the wrong continent's content with no visible error; this class of bug would likely pass casual QA since the wrong screen still "looks fine," it's just the wrong content.
- **Marquee reshuffle-on-rerender (section 6.6)** — depends on `allDinos` reference stability from `App.js`/`useMemo`; if that ever changes to a new array identity on unrelated re-renders (e.g. a future refactor), the marquee would visibly reset, which is easy to miss without deliberately testing an XP change while watching it.
- **Permanent-loading-on-total-failure (section 8.5)** — there is currently no retry/error UI on this screen if creature preload fails outright; this is a real UX gap worth flagging to the team, not just a QA checkbox.
- **Daily Dino card font discipline (section 4.9)** — likely fails the project's own Cinzel-for-scientific-names rule as currently written; confirm with whoever owns visual QA whether this is accepted or needs a fix.

---

## Explicitly out of scope for this checklist

- Automated/unit tests — none exist for this screen by project convention (UI is verified via manual/browser-driven QA, not component tests); this document is the verification method, not a gap.
- Deep testing of the destination screens (Gaming, Leaderboard, Gallery, Dashboard, region pack screens) reached FROM the landing page — only that navigation to them succeeds and lands on the right target.
- Supabase-side data correctness (e.g., whether `creatures.edu` values are seeded correctly in the database) — this checklist assumes the data is correct and tests that the UI reflects it faithfully; a data-seeding bug would look identical to a UI mapping bug from this checklist's vantage point, so if section 5.3 fails, check the database values before assuming the marker code is wrong.
