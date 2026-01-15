import { z } from '@kokimoki/kit';

export const schema = z.object({
	// translations
	title: z.string().default('My Game'),

	gameLobbyMd: z
		.string()
		.default(
			'# Waiting for game to start...\nThe game will start once the host presses the start button.'
		),
	connectionsMd: z.string().default('# Connections example'),
	sharedStateMd: z.string().default('# Shared State example'),
	sharedStatePlayerMd: z.string().default('# Shared State example for players'),

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
	lobbyLivesLabel: z.string().default('Lives Remaining:'),
	lobbyActivePlayersLabel: z.string().default('Active Players:'),
	lobbyEliminatedLabel: z.string().default('Eliminated:'),
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
	playerStartingLives: z.number().default(3),
	votingDurationSeconds: z.number().default(30),
	questionDisplaySeconds: z.number().default(5),
	resultsDisplaySeconds: z.number().default(5),
	baseScorePoints: z.number().default(10),
	maxOptionsPerQuestion: z.number().default(3),

	// AI and questions
	aiQuestionPrompt: z
		.string()
		.default(
			'Generate a fun party game question in JSON format with exactly 3 options. The question should have no obvious correct answer and encourage debate. Return JSON with "question" (string) and "options" (array of strings) fields.'
		),

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
			'# ❌ You were in the minority.\nUnfortunately, you picked the wrong side. -1 life'
		),
	eliminatedMessageMd: z
		.string()
		.default(
			"# 😵 You've been eliminated!\nYou're out of the game, but you can still watch the results."
		)
});

export type Config = z.infer<typeof schema>;
