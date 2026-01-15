import { z } from '@kokimoki/kit';

export const schema = z.object({
	// translations
	title: z.string().default('My Game'),

	gameLobbyMd: z
		.string()
		.default(
			'# Waiting for game to start...\nThe game will start once the host presses the start button.'
		),

	players: z.string().default('Players'),
	online: z.string().default('Online'),
	offline: z.string().default('Offline'),
	startButton: z.string().default('Start Game'),
	stopButton: z.string().default('Stop Game'),
	loading: z.string().default('Loading...'),

	menuHelpMd: z
		.string()
		.default('# Help\nInstructions on how to play the game.'),

	createProfileMd: z.string().default('# Create your player profile'),
	playerNamePlaceholder: z.string().default('Your name...'),
	playerNameLabel: z.string().default('Name:'),
	playerNameButton: z.string().default('Continue'),

	playerLinkLabel: z.string().default('Player Link'),
	presenterLinkLabel: z.string().default('Presenter Link'),

	togglePresenterQrButton: z.string().default('Toggle Presenter QR'),

	menuAriaLabel: z.string().default('Open menu drawer'),
	menuHelpAriaLabel: z.string().default('Open help drawer'),

	// Player pre-game screen
	preGameWelcome: z.string().default('Welcome, {name}!'),
	preGameWaitingMessage: z
		.string()
		.default('🎯 Waiting for the game to start...'),
	preGameInstructions: z
		.string()
		.default(
			'The host will begin the game soon. Get ready to vote with the majority!'
		),

	// Game lobby (between rounds)
	lobbyCurrentStatus: z.string().default('📊 Current Status'),
	lobbyRoundLabel: z.string().default('Round:'),
	lobbyYourScoreLabel: z.string().default('Your Score:'),
	lobbyActivePlayersLabel: z.string().default('Active Players:'),
	lobbyPointsLabel: z.string().default('points'),
	lobbyWaitingTitle: z.string().default('🎯 Waiting for Next Question'),
	lobbyWaitingMessage: z
		.string()
		.default('The host is selecting the next question...'),
	lobbyLoadingMessage: z.string().default('Loading player data...'),

	// Host screen
	hostSelectQuestion: z.string().default('Select Next Question'),
	hostStartRoundButton: z.string().default('Start Round'),
	hostGenerateStartButton: z.string().default('Generate & Start Round'),
	hostGeneratingButton: z.string().default('Generating...'),
	hostDeleteAllButton: z.string().default('Delete All'),
	hostDeleteAllConfirm: z
		.string()
		.default('Are you sure you want to delete all {count} questions?'),
	hostPlayedBadge: z.string().default('✓ Played'),

	// Game mechanics config
	maxRounds: z.number().default(10),
	votingDurationSeconds: z.number().default(30),
	baseScorePoints: z.number().default(10),
	maxOptionsPerQuestion: z.number().default(3),

	// AI and questions
	aiQuestionPrompt: z
		.string()
		.default(
			'Generate a fun party game question in JSON format with exactly 3 options. The question should have no obvious correct answer and encourage debate. Return JSON with "question" (string) and "options" (array of strings) fields.'
		),

	// Host screen - game view
	hostRoundPlayersLabel: z
		.string()
		.default('Round {roundNumber} • {activePlayers} Active Players'),
	hostVotingProgress: z
		.string()
		.default('{votedPlayers} / {activePlayers} players voted'),
	hostTimeRemainingLabel: z.string().default('Time remaining:'),
	hostGameOverTitle: z.string().default('Game Over!'),
	hostPlayerScoreFormat: z.string().default('{name}: {score} points'),
	hostPlayersLabel: z.string().default('Players'),
	hostSpectatorLabel: z.string().default('Spectator'),
	hostVotedLabel: z.string().default('✓ Voted'),
	hostWaitingLabel: z.string().default('Waiting...'),
	hostRevealResultsButton: z.string().default('Reveal Results'),
	hostNextRoundButton: z.string().default('Next Round'),
	hostNewGameButton: z.string().default('New Game'),
	hostStopGameButton: z.string().default('Stop Game'),
	hostEndGameButton: z.string().default('End Game'),

	// Presenter screen
	presenterVoteBreakdownTitle: z.string().default('Vote Breakdown'),
	presenterWaitingToStartMessage: z
		.string()
		.default('Waiting for game to start...'),
	presenterWaitingForRoundMessage: z
		.string()
		.default('Waiting for next round...'),
	presenterQuestionFollowedByVoting: z
		.string()
		.default('Question will be followed by a {seconds}s voting phase'),
	presenterGameOverTitle: z.string().default('🏆 Game Over!'),
	presenterWinnerMessage: z
		.string()
		.default('{name} wins with {score} points!'),
	presenterLeaderboardTitle: z.string().default('Leaderboard'),
	presenterPointsLabel: z.string().default('pts'),

	// Player screen - game over
	playerGameOverTitle: z.string().default('🏆 Game Over!'),
	playerFinalLeaderboardTitle: z.string().default('Final Leaderboard'),
	playerPointsLabel: z.string().default('pts'),
	playerResultsWaitingMessage: z.string().default('Waiting for next round...'),

	// Question management
	questionManagerTitle: z.string().default('Question Manager'),
	questionManagerDescription: z
		.string()
		.default('Generate AI questions or create custom ones for your game'),
	aiGeneratorTitle: z.string().default('AI Question Generator'),
	aiTopicsLabel: z.string().default('Topics or Themes (one per line)'),
	aiTopicsPlaceholder: z
		.string()
		.default('e.g., breakfast foods, movie genres, travel destinations'),
	aiAddTopicButton: z.string().default('Add Another Topic'),
	aiGeneratingProgress: z
		.string()
		.default('Generating {progress} / {total} questions...'),
	aiGenerateButton: z.string().default('Generate {count} Question{s}'),
	aiGeneratingLabel: z.string().default('Generating...'),
	customQuestionTitle: z.string().default('Create Custom Question'),
	customQuestionNewButton: z.string().default('New Custom Question'),
	customQuestionPlaceholder: z.string().default('Question text...'),
	customOptionPlaceholder: z.string().default('Option {n}'),
	customAddButton: z.string().default('Add Question'),
	customCancelButton: z.string().default('Cancel'),
	questionBankTitle: z.string().default('Question Bank ({count})'),
	questionBankDeleteAll: z.string().default('Delete All'),
	questionBankDeleteAllConfirm: z
		.string()
		.default('Are you sure you want to delete all {count} questions?'),
	questionBankEmpty: z
		.string()
		.default('No questions yet. Generate or create some!'),
	questionAiLabel: z.string().default('🤖 AI'),
	questionManualLabel: z.string().default('✏️ Manual'),
	questionEditButton: z.string().default('Edit'),
	questionSaveButton: z.string().default('Save'),
	questionSuggestedBy: z.string().default('Suggested by: {name}'),

	// Voting view
	votingNoQuestionMessage: z.string().default('No question loaded'),
	votingConfidenceLabel: z.string().default('How confident? {n}x points'),
	votingConfidenceMin: z.string().default('Not Sure'),
	votingConfidenceMax: z.string().default('Very Sure'),
	votingSubmitButton: z.string().default('Submit Vote'),
	votingSubmittedMessage: z.string().default('✓ Vote submitted!'),

	// Player topic submissions
	playerTopicsToggleButton: z.string().default('Toggle Player Topics'),
	playerTopicsEnabledLabel: z.string().default('Player Topics: ON'),
	playerTopicsDisabledLabel: z.string().default('Player Topics: OFF'),
	playerSubmitTopicTitle: z.string().default('Suggest a Topic'),
	playerSubmitTopicPlaceholder: z.string().default('Enter topic idea...'),
	playerSubmitTopicButton: z.string().default('Submit Topic'),
	playerTopicSubmittedMessage: z.string().default('Topic submitted!'),
	playerAlreadySubmittedMessage: z
		.string()
		.default('You already submitted a topic'),
	hostPlayerTopicsTitle: z.string().default('Player Suggested Topics'),
	hostGenerateFromTopicButton: z.string().default('Generate Question'),
	hostDeleteTopicButton: z.string().default('Delete'),
	hostNoPlayerTopics: z.string().default('No player topics yet'),
	aiTopicPrompt: z
		.string()
		.default(
			'Generate a fun party game question about: {topic}. Return JSON with exactly 3 options. The question should have no obvious correct answer and encourage debate. Return JSON with "question" (string) and "options" (array of strings) fields.'
		),

	// Game messages (markdown)
	winnersMessageMd: z
		.string()
		.default(
			'# 🎉 You got the majority!\nGreat prediction! You matched what the group thought.'
		),
	losersMessageMd: z
		.string()
		.default(
			'# ❌ You were in the minority.\nUnfortunately, you picked the wrong side.'
		)
});

export type Config = z.infer<typeof schema>;
