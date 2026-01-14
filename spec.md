# Majority Rules Game Specification

## Overview

**Majority Rules** is a psychological social game for 5–30 players where the goal isn't to be "right," but to be "common." Players predict how the majority will vote on subjective questions. Anyone in the minority loses a life. Hard elimination after 3 losses. Only voting results revealed at deadline.

## Core Game Mechanics

### 1. Game Flow

**Pregame Phase (Host):**

- Host accesses Question Manager to generate AI questions or manually create questions
- Questions have 2–3 options each
- Host approves/edits generated questions before launching round
- Question bank persists for session

**Round Flow:**

1. **Question Display** (5 seconds): All players see question, no voting yet
2. **Voting Phase** (30 seconds): Players select option + optional confidence (1–3x multiplier, default 1x), submit
3. **Results** (5 seconds): Votes aggregated and displayed with animations, scores calculated, eliminations processed
4. **Advance**: Check win condition; if active players > 1, next round; else game over

### 2. Voting & Confidence Slider

**Player Voting:**

- Select one option (required)
- Optionally move confidence slider: 1x = "Not Sure" to 3x = "Very Sure"
- Skip slider = default 1x multiplier
- 30-second countdown timer with auto-submit on timeout
- Once submitted, cannot change vote

**Auto-Submit Behavior:**

- If voting deadline reached and player hasn't submitted, auto-submit with: selected option (if any) + default 1x confidence
- If no option selected by deadline, auto-submit as "no vote" (treated as loss)

### 3. Vote Aggregation & Winners

**Vote Reveal (At Deadline Only):**

- Votes hidden during voting phase (no live aggregation shown to players or host/presenter)
- At voting deadline, all votes simultaneously revealed
- Results calculated and displayed

**Winner Determination:**

- Count votes per option
- **All options with maximum vote count are "winning options"** (tie handling: all tied options win)
- Any player who selected a winning option gets points
- Any player who selected a non-winning option loses 1 life

**Example:**

- Question: "Pancakes or Waffles?"
- Votes: 12 Pancakes, 12 Waffles, 1 French Toast
- Winners: All Pancakes voters AND all Waffles voters (12 points each + confidence multiplier)
- Losers: French Toast voter (loses 1 life)

### 4. Scoring System

**Margin-Based Scoring Formula:**

```
Score = baseScore * confidenceMultiplier * marginBonus
```

Where:

- `baseScore`: 10 points (configured in `baseScorePoints`)
- `confidenceMultiplier`: 1–3 (from slider, default 1)
- `marginBonus`: `(100 - votingMargin) / 50` (capped at 2x max)
  - `votingMargin` = `(maxVotes - secondMaxVotes) / totalVotes * 100`
  - Close calls (low margin) reward higher multiplier
  - Landslides (high margin) reward lower multiplier

**Examples:**

- 51% majority (margin = 49%): marginBonus = 51/50 = 1.02x (high bonus)
- 75% majority (margin = 50%): marginBonus = 50/50 = 1.0x (normal)
- 90% majority (margin = 80%): marginBonus = 20/50 = 0.4x (low bonus)

**Tie Handling:**

- If multiple options tie for max votes, all are winners (no penalty for picking tied options)
- All non-winning options split loss among voters
- Margin calculation uses actual vote counts

### 5. Elimination & Spectator Mode

**Hard Elimination:**

- Each player starts with 3 lives
- Lose 1 life every round you pick non-winning option (or timeout without submitting)
- When lives reach 0: **immediately switched to spectator mode** (cannot vote, cannot affect game)

**Spectator Mode:**

- Can view current question, votes, results, leaderboard
- Read-only UI (dimmed, no interaction)
- Display "You've Been Eliminated" badge
- Remains visible through game end
- See final leaderboard and elimination status

**Game-Over Condition:**

- Game ends when only 1 active (non-spectator) player remains
- All other players are spectators
- Winner = the last active player

### 6. Question Management (Host)

**AI Generation:**

- Host inputs topic/theme (e.g., "breakfast foods", "movie genres")
- Call `kmClient.ai.generateJson()` with prompt requesting 2–3 option question
- System generates: question text + 2–3 option texts
- Host sees preview with option to edit question text or individual options
- Approve to add to question bank

**Manual Creation:**

- Host inputs question text + 2–3 option texts
- Add to question bank
- Can edit/delete questions in queue

**Question Bank:**

- Persists for session (not across game restarts)
- Host can drag-reorder questions
- Color-coded: generated (blue tint), manual (purple tint)
- Launch button selects question to start round

### 7. Visual Design System

**Color Palette:**

- **Primary**: Vibrant blue (Kokimoki theme)
- **Success**: Green #22c55e (winning option, winner highlights)
- **Danger**: Red #ef4444 (losing option, outlier highlights)
- **Option Colors**:
  - Option 1: Blue `oklch(0.6 0.15 230)`
  - Option 2: Green `oklch(0.6 0.15 150)`
  - Option 3: Orange `oklch(0.6 0.15 50)`
- **Neutrals**: Gray palette for spectators, disabled states

**Typography:**

- Font: Noto Sans (system default)
- Question Display: `font-weight: 700` (bold) for emphasis
- Large size (48px+) on presenter screen, 32px+ on player screens

**UI Components:**

- **Cards**: Gradient backgrounds (primary blue for questions), shadow, rounded corners
- **Buttons**: Gradient fill, hover scale (1.05), glow effect, disabled state gray
- **Options**: Large cards (blue/green/orange), hover shadow scale, border glow on selection
- **Timer**: Circle progress ring, color gradient (green → yellow → red at final 5 sec)
- **Leaderboard**: Smooth transitions (300ms) on rank/score updates, alternating row tints

**Animations:**

- **Count-up**: Vote counts and scores animate from 0 to final value (300ms, ease-out)
- **Grow**: Bar chart bars grow left-to-right on reveal (400ms, ease-out)
- **Pop**: Score change notification (scale 1 → 1.2, fade in, 300ms)
- **Pulse**: Eliminated badge opacity fade (0.5s, repeat)
- **Fade**: Game phase transitions (300ms fade-in/fade-out)

**Accessible Elements:**

- Option buttons include option letter (A/B/C) in addition to color
- High contrast for large screen presenter display
- Spectator badge red + grayed styling (not color-dependent)

## Configuration

**Game Parameters** (`schema.ts` and `default.config.yaml`):

```yaml
playerStartingLives: 3                    # Lives per player
votingDurationSeconds: 30                 # Voting phase duration
questionDisplaySeconds: 5                 # Question display before voting
resultsDisplaySeconds: 5                  # Results visible before next round
confidenceSliderRange: [1, 3]            # Multiplier range
maxOptionsPerQuestion: 3                  # Max options per question
baseScorePoints: 10                       # Base points per round
aiQuestionPrompt: "Generate a subjective..." # AI generation template
winnersMessageMd: "# You got it right!..." # Winner message (markdown)
losersMessageMd: "# Oops, you were..."  # Loser message (markdown)
eliminatedMessageMd: "# You're out!"...  # Eliminated message (markdown)
```

## Game Phases

- `lobby`: Pregame, waiting to start
- `question-display`: Showing question for 5 seconds (no voting)
- `voting`: Players selecting options + confidence (30 seconds)
- `results`: Displaying results, scores, eliminations (5 seconds)
- `game-over`: Final leaderboard, game ended

## Display Modes

### Player Mode

**Active Player:**

- Sees question during `question-display` phase (static, no interaction)
- Sees [voting-view.tsx](src/views/voting-view.tsx) during `voting` phase (interactive)
- Sees [results-view.tsx](src/views/results-view.tsx) during `results` phase
- Repeats until eliminated or game over

**Spectator (Eliminated):**

- Sees [spectator-view.tsx](src/views/spectator-view.tsx) for all phases
- Read-only question/options display
- Can see results after reveal
- Can see live leaderboard

### Host Mode

**Pregame:**

- [question-management-view.tsx](src/views/question-management-view.tsx): Manage questions (AI generate, manual create, queue, approve, launch)

**During Game:**

- Split layout with [HostPresenterLayout](src/layouts/host-presenter.tsx)
- Main area: Current question + real-time option vote badges (color-coded, live counts)
- Side panel: Player list (names, scores, lives remaining, voted/waiting status)
- Footer: "Start Voting" button (during question-display) → "Reveal Results" button (during voting) → "Next Round" button (during results)
- Red badge showing eliminated player count

### Presenter Mode

**All Phases:**

- Large question display (gradient card, 48px+ font, font-weight: 700)
- Full-width animated bar chart below question
  - Colored bars (blue/green/orange for options)
  - Vote count badges on bars
  - Animated reveal at voting deadline (bars grow left-to-right)
- [KmPodiumTable](kokimoki-shared.instructions.md#kmpodiumtable) leaderboard (top 3 players)
  - Smooth transitions (300ms) on score updates
- Right sidebar: "Spectators" section
  - Lists eliminated players with red badges
  - Sorted by final score
- Timer overlay: Large countdown in corner
  - Green (plenty of time) → yellow → red (final 5 seconds)

## Win Condition & Game End

**Winner:**

- Last remaining active (non-spectator) player
- All others have 0 lives and are spectators

**Game-Over Screen:**

- Winner announcement: "🏆 [Winner Name] Wins!" (gold-gradient text, large)
- Final leaderboard: [KmPodiumTable](kokimoki-shared.instructions.md#kmpodiumtable) showing all players ranked by final score
- Spectators section: Eliminated players (grayed, below active players)
- Host button: "Start New Game" (gradient, large, hover scale) to reset and restart

## Implementation Notes

- Use `kmClient.transact()` for all state updates (atomic)
- Use `useSnapshot()` for reactive state in React components
- AI questions generated with `kmClient.ai.generateJson()` (prompt must include word "json")
- Vote aggregation happens only at deadline, not during voting phase
- All animations use CSS transitions (300ms smooth)
- Spectator view accessible via updated `playerStore.currentView`
- Global controller manages round progression and elimination logic
