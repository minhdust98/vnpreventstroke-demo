---
name: VNPreventStroke (patient app)
description: Large-type, one-accent, iOS-grammar stroke prevention app for older patients.
colors:
  tint: "#0A5BD3"
  tint-ink: "#0B4FB8"
  tint-soft: "#E5ECF8"
  on-tint: "#FFFFFF"
  green: "#1B7A3A"
  green-bg: "#E6F4EA"
  amber: "#8F4F00"
  amber-bg: "#FFF1DA"
  red: "#C8102E"
  red-bg: "#FDEBEE"
  bg: "#F2F2F7"
  card: "#FFFFFF"
  ink: "#111114"
  ink2: "#56565C"
  sep: "#DCDCE1"
  fill: "#E9E9EE"
  tint-dark: "#2563EB"
  tint-ink-dark: "#8AB8FF"
  tint-soft-dark: "#1E2B44"
  green-dark: "#5FD98A"
  green-bg-dark: "#123020"
  amber-dark: "#FFC266"
  amber-bg-dark: "#3A2A0F"
  red-dark: "#D4213A"
  red-bg-dark: "#3D1219"
  bg-dark: "#000000"
  card-dark: "#1C1C1E"
  ink-dark: "#F5F5F7"
  ink2-dark: "#AEAEB5"
  sep-dark: "#38383C"
  fill-dark: "#2C2C2E"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "2.15rem"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "3.6rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 800
    lineHeight: 1.2
  lead:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 600
    lineHeight: 1.28
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1.34
rounded:
  s: "0.75rem"
  m: "1.1rem"
  l: "1.5rem"
  full: "999px"
spacing:
  tight: "0.4rem"
  inner: "0.75rem"
  stack: "0.9rem"
  gutter: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.on-tint}"
    typography: "{typography.lead}"
    rounded: "{rounded.m}"
    height: "3.6rem"
    width: "100%"
  button-soft:
    backgroundColor: "{colors.tint-soft}"
    textColor: "{colors.tint-ink}"
    rounded: "{rounded.m}"
    height: "3.6rem"
  button-plain:
    textColor: "{colors.tint-ink}"
    height: "3rem"
  button-emergency:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.m}"
    height: "3.6rem"
  button-115-huge:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.l}"
    height: "5.6rem"
  sos-pill:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-tint}"
    rounded: "{rounded.full}"
    height: "3rem"
  list-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "0.55rem 1rem"
    height: "3.5rem"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.m}"
    padding: "1rem"
  chip:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    height: "3.4rem"
  chip-selected:
    backgroundColor: "{colors.tint-soft}"
    textColor: "{colors.tint-ink}"
    rounded: "{rounded.m}"
  keypad-key:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    height: "3.7rem"
  number-field:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.m}"
    padding: "0.55rem 0.8rem"
  sheet:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.l}"
    padding: "0.5rem 1rem 1.4rem"
  status-pill-good:
    backgroundColor: "{colors.green-bg}"
    textColor: "{colors.green}"
    rounded: "{rounded.full}"
  status-pill-amber:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.amber}"
    rounded: "{rounded.full}"
  status-pill-red:
    backgroundColor: "{colors.red-bg}"
    textColor: "{colors.red}"
    rounded: "{rounded.full}"
  befast-letter:
    backgroundColor: "{colors.red-bg}"
    textColor: "{colors.red}"
    rounded: "{rounded.s}"
    size: "3rem"
---

# Design System: VNPreventStroke (patient app)

## Overview

**Creative North Star: "The Large-Print Settings App"**

The app borrows the grammar of a phone's own settings and health screens: a pale grey ground, rounded white lists, one large title, one idea per row, a value on the right. Everything is set larger than that grammar usually is, because the people using it are older, often have weak eyesight, and use one hand. Calm and plain is the point; the only loud thing on any screen is the red 115 button.

Density is low and deliberate. A screen does one job; today's job sits at the top. Words are cut until each row says one thing with no subtitle, and when a layout seems to need an explanation, the layout changes instead. Numbers are the heroes of result screens and are set in tabular figures.

**Key Characteristics:**
- One accent (blue tint) for action, selection and progress; severity colour only with a shape.
- Grouped inset lists and cards on a tonal grey ground; no decorative shadows.
- One large title per screen; no taglines, helper text or secondary row labels.
- Every size in rem, so the user's text size choice grows buttons, rows and spacing too.
- The 115 button sits in the top bar of every screen with chrome.

## Colors

A neutral system-grey palette with one blue accent, a three-tone severity triad and a red reserved for emergencies.

### Primary
- **Action Blue** (`tint`): primary buttons, selected chips and fields (3px ring), checked checkboxes, on switches, filled adherence dots, progress bars, the active tab. In dark mode it shifts to a brighter blue (`tint-dark`).
- **Link Blue** (`tint-ink`): text-only actions: "Đóng", back labels, group-head links, soft-button text, the active tab label.
- **Blue Wash** (`tint-soft`): soft secondary buttons, selected-chip fill, banners, step-number discs.

### Status (severity only)
- **Good Green** (`green` on `green-bg`): status "good", always with a check.
- **Caution Amber** (`amber` on `amber-bg`): "could improve" with a dot; "high" or "low" with a triangle. Also the "BẢN DEMO" label and warning boxes.
- **Emergency Red** (`red` on `red-bg`): 115 buttons, the emergency card row, BE FAST surfaces, critical status with a triangle.

### Neutral
- **Grouped Grey** (`bg`): screen ground and sticky top bar.
- **Card White** (`card`): lists, cards, keys, fields, sheets, dialogs, tab bar. On white screens and inside sheets, nested lists and cards swap to `bg` so they still read as containers.
- **Ink** (`ink`) and **Secondary Ink** (`ink2`): text; `ink2` for values, group heads, idle icons, chevrons, unchecked rings.
- **Hairline** (`sep`): inset row separators, 1px inset outlines on keys, chips and fields.
- **Fill** (`fill`): pressed rows, segmented control track, off switch, empty dots and progress segments.

### Named Rules
**The One Accent Rule.** Blue is the only colour that means "you can act" or "this is chosen". No second accent, no coloured icon tiles.

**The Shape-With-Colour Rule.** Green, amber and red appear only as severity and never alone: check = good, dot = could improve, triangle = high, low or critical. Status text also carries the word.

**The Red Is 115 Rule.** Red marks emergency actions and stroke-sign content only (115 buttons, "Có, đang xảy ra", emergency card row, BE FAST, critical readings). List-row icons are neutral `ink2`; only emergency rows get a red icon.

## Typography

**Display Font:** the platform system UI face (SF Pro on Apple, Segoe UI / Roboto elsewhere)
**Body Font:** the same stack

**Character:** native and legible; full Vietnamese diacritic coverage offline with no font download. Hierarchy comes from size and weight (600 to 800), not from a second family.

### Hierarchy
Sizes are rem; the root is 14.5px (m), 16px (l, default) or 18.5px (xl).
- **Display** (800, 2.15rem, 1.12, -0.02em): the one screen title. Smaller steps: 1.8rem for task screens, 1.65rem for question titles.
- **Numeral** (800, 3.6rem, 1.05, tabular): the reading on result and detail screens; 2.8rem inside number fields; 2 / 2.4 / 5rem variants.
- **Headline** (800, 1.4rem): sheet and dialog titles.
- **Lead** (600, 1.25rem, 1.3): the one sentence of a card; button labels use 700 at 1.22rem.
- **Title** (600, 1.15rem, 1.28): row titles, values, card heads (700).
- **Body** (400, 1.15rem, 1.45): article and explanation text; lists at 1.2rem.
- **Label** (700, 1.05rem, `ink2`): group heads, field labels, the label above a hero number. Never uppercase.

### Named Rules
**The One Title Rule.** Each screen has exactly one large title. On Today the title is the date ("Thứ Bảy, 31/10"); there is no greeting or tagline.

**The No Subtitle Rule.** A row has a title and at most a value. No second line, no helper text under inputs.

**The Local Format Rule.** 24-hour time (07:00), dd/mm dates, decimal comma (5,6). Numbers and their unit never break across lines.

## Layout

A single phone column. Screens pad 1rem at the sides and stack sections with a 0.9rem gap; cards pad 1rem with 0.75rem inside; group heads sit 0.4rem above their list. A sticky top bar (min 3.6rem) holds the left control (avatar, "Đóng" or back) and the 115 pill on the right. Primary actions on task screens sit in a sticky bottom bar separated by a hairline. Paired actions and fields use a two-column grid with 0.6rem gap.

Touch targets are at least 44px (2.75rem minimum for any control; buttons 3.6rem, keys 3.7rem, rows 3.5rem). Because everything is rem, extra-large text enlarges controls and spacing together. At 320px wide with extra-large text, leading row icons are hidden (container query, 360px) so titles keep their room; values never truncate and titles wrap instead. Real phones respect safe-area insets on the status bar, tab bar and sheets.

**Navigation grammar.** Three tabs: Trang chủ, Thông báo, Cài đặt. Trang chủ is a greeting, a Hôm nay block (today's doses and readings) and five large function tiles (Dự đoán nguy cơ, Thuốc, Hồ sơ sức khỏe, Liên hệ, Giáo dục sức khỏe) that push their own screens with a back label "Trang chủ". Tasks such as entering a reading are full-screen modals with "Đóng" and no tab bar. Short pickers are bottom sheets with "Đóng". Result screens are one-way: no back into the entry, and "Xong" returns to where the flow began. The 115 pill is hidden at step 1 (flag `FEATURES.sos`); when on, it sits on every screen and every result screen.

## Elevation & Depth

Flat, tonal layering. Depth comes from white containers on grey (or grey containers on white inside sheets), 1px inset hairlines and the scrim behind sheets and dialogs. The only in-app shadow is the small lift under the selected segment (`0 1px 3px rgba(0,0,0,.18)`). The large ambient shadow in the stylesheet belongs to the demo phone frame, not the app.

**The Flat Ground Rule.** Cards, lists, buttons and fields never cast shadows. Selection is a 3px inset blue ring, not a lift.

## Shapes

Soft continuous rounding in three steps plus full round:
- **Medium** (`rounded.m`): cards, lists, buttons, chips, keys, inputs, banners, toast.
- **Large** (`rounded.l`): sheets (top corners), dialogs, the lock-screen notification, the huge 115 button, the app mark.
- **Small** (`rounded.s`): BE FAST letter tiles only.
- **Full**: the 115 pill, status pills, badges, avatar, checkboxes, adherence dots, switches, progress segments.

Outlines are inset box-shadows (1px hairline idle, 3px blue selected), never borders that shift layout.

## Components

### Buttons
Full-width, tall and immediate.
- **Shape:** medium radius; huge 115 uses large radius at 5.6rem tall and 2rem type.
- **Primary:** blue fill, white 700 label; one per screen.
- **Soft:** blue wash with link-blue text for the secondary action.
- **Plain:** text-only link blue, 3rem tall, for tertiary actions like "Sửa số".
- **Emergency:** red fill, white text, phone icon; only for calling 115 or confirming active symptoms.
- **States:** press scales to 0.97 in 100ms; disabled at 40% opacity; focus is a 3px blue outline offset 2px.

### Chips and segmented control
- **Chips:** full-width stacked answer buttons (3.4rem, 4rem tall variant) or two-column / wrapping grids; white with a hairline. Selected: blue wash, link-blue 700 text, 3px blue inset ring.
- **Segmented:** grey track, white raised selected segment with 800 weight.

### Lists and rows
- **Style:** inset grouped list in a medium-radius white container; separators indent 1rem; the whole row darkens to `fill` on press.
- **Function tile:** two-column grid on the home screen, white `r-m` card, 2rem icon in link blue above a 700 label, min height 6.6rem; an odd last tile spans both columns.
- **Row:** optional neutral leading icon, title, right-aligned value in `ink2` (tabular), chevron when it navigates. A non-good status tints the value amber or red and prefixes the status shape.
- **Controls in rows:** round 1.9rem checkbox (blue when checked), 3.4rem switch (blue track when on, thumb slides 150ms).

### Cards
- **Corner Style:** medium radius. **Background:** white (grey on white screens and in sheets). **Shadow:** none. **Padding:** 1rem, 0.75rem gap.
- A card head is a 700 title with an optional `ink2` aside on the right (time, date, count). Lists inside a card bleed to its edges.

### Inputs and the number pad
- **Number entry:** two big fields (label + 2.8rem numeral, en dash when empty) above a 3-column keypad of white keys (1.75rem digits); the bottom-left slot holds a contextual action or the decimal comma; delete is plain.
- **Text inputs:** white, hairline, medium radius, at least 16px text. Focused field gets the 3px blue ring.
- **Dates:** a list row showing dd/mm/yyyy in link blue, with the native picker laid invisibly over it.

### Navigation
- **Tab bar:** white, hairline top, three equal columns, 1.65rem icons over 0.92rem labels; active tab in link blue at 800.
- **Top bar:** sticky, matches the screen ground; absent on tab roots when 115 is hidden, "Đóng" on modals, chevron + parent name on pushes; the 115 pill on the right when enabled.
- **Sheets:** rise from the bottom, large top radius, title at 1.4rem with "Đóng" on the right.

### Status pill
Full-round pill in the status wash with status-coloured 700 text, the status shape icon and the word. Sits centred under the hero number on result screens.

### Adherence dots
Seven round dots, one per weekday: blue filled with a check when all doses taken, half blue when partial, outlined while the day is in progress, grey when empty.

### BE FAST card
Red full-width card with six translucent white letter tiles (small radius) and a bold line beneath; inside sign lists each letter sits in a red-wash tile.

### Motion
Only four movements: press feedback (scale 0.97, 100ms ease-out), switch thumb (150ms), sheet rise (200ms, `cubic-bezier(.23,1,.32,1)`), toast fade-and-rise. All animation and transition is removed under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** use `tint` for the single primary action, selection and progress, and nothing else.
- **Do** pair every green, amber or red with its shape (check, dot, triangle) and its word.
- **Do** keep the 115 pill in the top bar of every screen with chrome whenever `FEATURES.sos` is on.
- **Do** size everything in rem so m / l / xl text grows controls with it; keep targets at least 44px.
- **Do** give each screen one large title and let a row say one thing.
- **Do** use medium radius for containers and controls, large for sheets, dialogs and the huge 115 button, small only for BE FAST letters.
- **Do** design every screen for light, dark, extra-large text and 320px width.

### Don't:
- **Don't** add taglines, helper text, eyebrow labels or second lines under row titles.
- **Don't** put coloured tiles behind list icons; icons are `ink2`, red only on emergency rows.
- **Don't** use red for anything but emergency and critical status.
- **Don't** add shadows to cards, lists or buttons, or motion beyond the four listed.
- **Don't** let a result screen navigate back into its entry form.
- **Don't** use 12-hour time, mm/dd dates or a decimal point.
