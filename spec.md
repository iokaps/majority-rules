# Majority Rules Game Specification

## Overview

**Majority Rules** is a psychological social game where the goal isn't to be "right," but to be "common." Players predict how the majority will vote on subjective questions and accumulate points by matching the majority vote. Players compete over multiple rounds to achieve the highest score. Only voting results revealed at deadline.

## Core Game Mechanics

### 1. Game Flow

**Pregame Phase (Host):**

- Host accesses Question Manager to generate AI questions or manually create questions
- Questions have 2–3 options each
- Host approves/edits generated questions before launching round
- Question bank persists for session

**Round Flow:**

1. **Voting Phase** (30 seconds): Players see question and vote immediately (select option + confidence slider), submit
2. **Results**: Votes aggregated and displayed with animations, scores calculated, host manually advances
3. **Advance**: Host clicks "Next Round" to continue, or "End Game" to finish
4. **Game Over**: After maxRounds reached (if set) or host clicks "End Game"

### 2. Voting & Confidence Slider

**Player Voting:**

- Select one option (required)
- Confidence slider with 3 positions (default: middle/1x):
  - **Left (0.5x)**: Low confidence - half points if majority, **no penalty** if minority
  - **Middle (1x)**: Normal confidence - standard points if majority, standard penalty if minority
  - **Right (3x)**: High confidence - triple points if majority, triple penalty if minority
- 30-second countdown timer with auto-submit on timeout
- Once submitted, cannot change vote

**Auto-Submit Behavior:**

- If voting deadline reached and player hasn't submitted, auto-submit with: selected option (if any) + default 1x confidence
- If no option selected by deadline, player receives no points for that round

### 3. Vote Aggregation & Winners

**Vote Reveal (At Deadline Only):**

- Votes hidden during voting phase (no live aggregation shown to players or host/presenter)
- At voting deadline, all votes simultaneously revealed
- Results calculated and displayed

**Winner Determination:**

- Count votes per option
- **All options with maximum vote count are "winning options"** (tie handling: all tied options win)
- Any player who selected a winning option gets points
- Any player who selected a non-winning option receives no points for that round

**Example:**

- Question: "Pancakes or Waffles?"
- Votes: 12 Pancakes, 12 Waffles, 1 French Toast
- Winners: All Pancakes voters AND all Waffles voters (earn points based on confidence multiplier)
- Losers: French Toast voter (no points awarded)

### 4. Scoring System

**Winning the Majority:**

Score = baseScore × confidenceMultiplier × marginBonus

Where:

- `baseScore`: 10 points (configured in `baseScorePoints`)
- `confidenceMultiplier`: 0.5, 1, or 3 (from slider position)
- `marginBonus`: `votingMargin / 50` (capped at 2x max)
  - `votingMargin` = `(maxVotes - secondMaxVotes) / totalVotes × 100`
  - **Higher consensus (larger margin) = higher bonus** (this is a majority game!)

**Examples (Winners):**

- Everyone agrees (100% margin): marginBonus = 2x (maximum)
- Strong majority (66% margin): marginBonus = 1.33x
- Close call (10% margin): marginBonus = 0.2x (minimum)

**Losing the Majority (Penalties):**

- **0.5x confidence**: No penalty (safe choice)
- **1x confidence**: Lose baseScore × 1 = 10 points
- **3x confidence**: Lose baseScore × 3 = 30 points

**Tie Handling:**

- If multiple options tie for max votes, all tied options are winners
- All players who voted for any tied option receive **half the normal points**
- Example: Options A and B both get 5 votes (tied) → all A and B voters get 50% points

### 5. Game Duration & End Condition

**Round-Based Game:**

- Game runs for a configurable number of rounds (default: 10)
- Setting `maxRounds` to 0 enables unlimited rounds (manual stop only)
- All players remain active throughout the entire game (no elimination)
- Players accumulate points across all rounds

**Game-Over Conditions (Hybrid):**

1. **Automatic**: Game ends after `maxRounds` rounds (if maxRounds > 0)
2. **Manual**: Host can click "Stop Game" button at any time to end immediately

**Winner Determination:**

- Player with highest total score at game end wins
- Ties awarded to all players with max score

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
maxRounds: 10 # Max rounds (0 = unlimited)
votingDurationSeconds: 30 # Voting phase duration
questionDisplaySeconds: 5 # Question display before voting
resultsDisplaySeconds: 5 # Results visible before next round
confidenceSliderRange: [1, 3] # Multiplier range
maxOptionsPerQuestion: 3 # Max options per question
baseScorePoints: 10 # Base points per round
aiQuestionPrompt: 'Generate a subjective...' # AI generation template
winnersMessageMd: '# You got the majority!...' # Winner message (markdown)
losersMessageMd: '# You were in the minority...' # Loser message (markdown)
```

## Game Phases

- `lobby`: Between rounds, host selects next question
- `voting`: Players selecting options + confidence (30 seconds)
- `results`: Displaying vote breakdown and scores, waiting for host to advance
- `game-over`: Final leaderboard, game ended (question hidden)

## Display Modes

### Player Mode

**All Players:**

- Sees question during `question-display` phase (static, no interaction)
- Sees [voting-view.tsx](src/views/voting-view.tsx) during `voting` phase (interactive)
- Sees [results-view.tsx](src/views/results-view.tsx) during `results` phase
- Sees [game-lobby-view.tsx](src/views/game-lobby-view.tsx) between rounds
- All players remain active throughout the entire game

### Host Mode

**Pregame:**

- [question-management-view.tsx](src/views/question-management-view.tsx): Manage questions (AI generate, manual create, queue, approve, launch)

**During Game:**

- Split layout with [HostPresenterLayout](src/layouts/host-presenter.tsx)
- Main area: Current question + real-time voting progress
- Side panel: Player list (names, scores, voted/waiting status)
- Header: Round counter showing current round and active player count
- Footer buttons:
  - Lobby: "Start Round" (launches selected question)
  - Voting: "Reveal Results" (calculates scores, shows results)
  - Results: "Next Round" (returns to lobby) + "End Game" (jumps to game-over)
  - Always available: "Stop Game" (returns to pregame)

### Presenter Mode

**Layout:**

- **Main Content Area** (left, stacked vertically):
  - Large question display (gradient card, 48px+ font, font-weight: 700)
  - Animated vote breakdown bar chart (during results phase)
    - Colored bars (blue/green/orange for options)
    - Large vote count and percentage labels
    - Animated reveal (bars grow left-to-right, 500ms)
  - **Full player leaderboard** (ALL players, not just top 3)
    - Grid layout (2-3 columns)
    - Large cards with rank badges, names, and scores
    - Top 3 highlighted with colored rings (gold/silver/bronze)
- **Sidebar** (right, sticky):
  - QR code only (180px, for player join)
- **Timer**: Large countdown circle during voting phase
  - Blue (plenty of time) → red pulsing (final 5 seconds)

**Game-Over Phase:**

- Question is hidden (only shows "🏆 Game Over!" message)
- Full leaderboard remains visible

## Win Condition & Game End

**Winner:**

- Player with highest total score after all rounds complete
- Ties awarded to all players with maximum score

**Game-Over Screen:**

- Winner announcement: "🏆 Game Over!" (gold-gradient text, large)
- Final leaderboard showing all players ranked by final score
  - Sorted descending by score
  - Shows player names and total points earned
- Host button: "New Game" to reset and restart
- Player view: Full leaderboard with final rankings

## Implementation Notes

- Use `kmClient.transact()` for all state updates (atomic)
- Use `useSnapshot()` for reactive state in React components
- AI questions generated with `kmClient.ai.generateJson()` (prompt must include word "json")
- Vote aggregation happens only at deadline, not during voting phase
- All animations use CSS transitions (300ms smooth)
- Game ends when: `roundNumber >= maxRounds` (if maxRounds > 0) OR host clicks "Stop Game"
- Global controller manages round progression and automatic game-over checks
