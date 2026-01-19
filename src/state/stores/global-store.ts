import { kmClient } from '@/services/km-client';

export type GamePhase =
	| 'lobby'
	| 'question-display'
	| 'voting'
	| 'results'
	| 'game-over';

export interface Question {
	id: string;
	text: string;
	options: string[];
	isAiGenerated: boolean;
}

export interface PlayerData {
	name: string;
	score: number;
	hasVoted: boolean;
}

export interface PlayerVote {
	optionIndex: number;
	confidence: number; // 1-3
}

export interface GlobalState {
	controllerConnectionId: string;
	started: boolean;
	startTimestamp: number;
	players: Record<string, PlayerData>;
	showPresenterQr: boolean;

	// Game state
	gamePhase: GamePhase;
	roundNumber: number;
	currentQuestion: Question | null;
	questionBank: Question[];
	usedQuestionIds: string[];
	votes: Record<string, PlayerVote>; // key: clientId
	voteAggregation: Record<number, number>; // key: optionIndex, value: vote count
	votingEndTimestamp: number;
	aiGenerationStatus: 'idle' | 'generating' | 'ready';
	roundPoints: Record<string, number>; // key: clientId, value: points from this round

	// Player topic submissions
	playerTopicsEnabled: boolean;
	playerTopics: Record<
		string,
		{
			topic: string;
			submittedBy: string;
			submittedByName: string;
			timestamp: number;
		}
	>;
}

const initialState: GlobalState = {
	controllerConnectionId: '',
	started: false,
	startTimestamp: 0,
	players: {},
	showPresenterQr: true,

	// Game state
	gamePhase: 'lobby',
	roundNumber: 0,
	currentQuestion: null,
	questionBank: [],
	usedQuestionIds: [],
	votes: {},
	voteAggregation: {},
	votingEndTimestamp: 0,
	aiGenerationStatus: 'idle',
	roundPoints: {},

	// Player topic submissions
	playerTopicsEnabled: false,
	playerTopics: {}
};

export const globalStore = kmClient.store<GlobalState>('global', initialState);
