# Kit Builder Testing Feedback - April 2026

## Source
Testing session with Dan and Erin. Feedback collected via shared Google Doc.

## What's Working Well
- "Best match" trust-building system (doesn't default to most expensive radio)
- Showing two options with clear differentiation
- MODULE window explanations of product relevance

## Bugs Reported

### 1. Header Shrink/Bounce (Chrome/Brave)
Header shrinks and bounces back and forth when scrolling down. Only observed in Brave/Chrome. Header bisects the Kit Builder headline.

### 2. Radio Options Not All Clickable
Only some of the "choose your radio" options are active and clickable.

## UX Issues

### 3. Two Separate Antenna Steps Are Confusing
"Why two tabs for Antennas? Uncertain what I need to choose." Users don't understand the distinction between "Antenna Upgrades" and "Additional Antennas."

### 4. Accessories Section Is Overwhelming
"This is where I start to get overwhelmed. Could benefit from clarity on extras." New users get lost in the sea of accessory options.

### 5. Type Too Small
"Type is a bit small across the board." (Dan)

### 6. Consult Button Not Prominent Enough
"Book a consult button needs to be more prominent." (Dan)

### 7. Back Button Placement Inconsistent
"Back buttons should be consistently in one place." Layout shifts between steps as elements appear/disappear.

## Recommended Solutions (from testers)

### Copy/Language
- Reference Apple.com shopping experience for clearer option explanations
- Restructure antenna labels with "best use" descriptors:
  - "Signal Stick - Best Overall Use"
  - "Stubby - Best Covert Carry Use"
  - "Foul Weather - Best Chest Rig and Plate Carrier Use"
- Add "Help me understand these options" expandable button/popup

### Layout
- Consolidate antenna steps (eliminate confusion)
- Increase type size throughout
- Prominently position consult call-to-action
- Keep navigation buttons in a fixed, consistent position

### Overall Assessment
- Semi-experienced users: not overwhelming
- Very new users: gets overwhelming once in accessories/extras
- Goal: fine-tuning for clarity, not system overhaul
- Maintain MODULE window explanations (effective communication)

---

## Implementation Plan

### Step 0: Document this plan (this file)

### Step 1: Bug Fixes
- **Header bounce:** Add `scroll-margin-top` to scroll targets to account for theme sticky header
- **Radio clickability:** Investigate selector phase for missing onclick handlers or incorrect disabled state

### Step 2: Antenna Consolidation + Best-Use Labels
- Merge "Antenna Upgrades" and "Additional Antennas" into a single "Antennas" step with two subsections
- Add `bestUse` field to antenna data with short descriptors (e.g., "Best for: Covert Carry")

### Step 3: Typography Bump
Increase font sizes across the board:
| Element | Before | After |
|---------|--------|-------|
| Card name | 15px | 16px |
| Card desc | 12px | 13px |
| Card price | 16px | 17px |
| Section text | 14px | 15px |
| Step labels | 11px | 12px |
| Hero desc | 14px | 15px |

### Step 4: Consult Button
Restyle from subtle gray to prominent gold outline with icon.

### Step 5: Accessories Help Section
Add collapsible "Not sure what you need?" guide at top of accessories step with brief per-item explanations.

### Step 6: Bottom Bar Layout Consistency
Keep consult button visible on all steps (dimmed on review) to prevent reflow.
