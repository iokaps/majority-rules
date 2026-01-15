import { PlayerMenu } from '@/components/menu';
import { NameLabel } from '@/components/name-label';
import { withKmProviders } from '@/components/with-km-providers';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { PlayerLayout } from '@/layouts/player';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { playerActions } from '@/state/actions/player-actions';
import { globalStore } from '@/state/stores/global-store';
import { playerStore } from '@/state/stores/player-store';
import { CreateProfileView } from '@/views/create-profile-view';
import { GameLobbyView } from '@/views/game-lobby-view';
import { ResultsView } from '@/views/results-view';
import { SpectatorView } from '@/views/spectator-view';
import { VotingView } from '@/views/voting-view';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';

const App: React.FC = () => {
	const { title } = config;
	const { name } = useSnapshot(playerStore.proxy);
	const {
		started,
		gamePhase,
		currentQuestion,
		players,
		voteAggregation,
		votes,
		playerTopicsEnabled,
		playerTopics
	} = useSnapshot(globalStore.proxy);
	const isSpectator = players[kmClient.id]?.isSpectator ?? false;

	useGlobalController();
	useDocumentTitle(title);

	// Get current player data to calculate results
	const currentVote = votes[kmClient.id] || null;

	// Determine if player won this round
	const playerWon = React.useMemo(() => {
		if (!currentVote || !currentQuestion || gamePhase !== 'results')
			return false;
		const maxVotes = Math.max(...Object.values(voteAggregation), 0);
		const winningIndices = Object.entries(voteAggregation)
			.filter(([, count]) => count === maxVotes && maxVotes > 0)
			.map(([index]) => parseInt(index, 10));
		return winningIndices.includes(currentVote.optionIndex);
	}, [currentVote, currentQuestion, gamePhase, voteAggregation]);

	// Auto-transition to next phase
	React.useEffect(() => {
		if (gamePhase === 'question-display' && started) {
			const timeout = setTimeout(() => {
				// Auto-advance to voting
				playerActions.setCurrentView('voting');
			}, config.questionDisplaySeconds * 1000);
			return () => clearTimeout(timeout);
		}
	}, [gamePhase, started]);

	React.useEffect(() => {
		if (gamePhase === 'results' && started) {
			const timeout = setTimeout(() => {
				// Auto-advance to next round or game-over
				playerActions.setCurrentView('lobby');
			}, config.resultsDisplaySeconds * 1000);
			return () => clearTimeout(timeout);
		}
	}, [gamePhase, started]);

	if (!name) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header />
				<PlayerLayout.Main>
					<CreateProfileView />
				</PlayerLayout.Main>
			</PlayerLayout.Root>
		);
	}

	// Spectator mode - always show spectator view
	if (isSpectator) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header />
				<PlayerLayout.Main>
					<SpectatorView />
				</PlayerLayout.Main>
				<PlayerLayout.Footer>
					<NameLabel name={name} />
				</PlayerLayout.Footer>
			</PlayerLayout.Root>
		);
	}

	// Before game starts
	if (!started) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header>
					<PlayerMenu />
				</PlayerLayout.Header>

				<PlayerLayout.Main className="py-4">
					<div className="w-full space-y-4">
						<div className="overlay-blue text-center">
							<h2 className="mb-3 text-xl font-bold text-slate-900">
								{config.preGameWelcome.replace('{name}', name)}
							</h2>
							<p className="mb-2 text-base text-slate-700">
								{config.preGameWaitingMessage}
							</p>
							<p className="text-sm text-slate-600">
								{config.preGameInstructions}
							</p>
						</div>

						{/* Topic Submission Form */}
						{playerTopicsEnabled && (
							<TopicSubmissionForm
								playerName={name}
								hasSubmitted={kmClient.id in playerTopics}
							/>
						)}
					</div>
				</PlayerLayout.Main>

				<PlayerLayout.Footer>
					<NameLabel name={name} />
				</PlayerLayout.Footer>
			</PlayerLayout.Root>
		);
	}

	// Game in progress - route by phase
	return (
		<PlayerLayout.Root>
			<PlayerLayout.Header>
				{currentQuestion && (
					<div className="text-sm font-semibold text-slate-600">
						Round {globalStore.proxy.roundNumber}
					</div>
				)}
			</PlayerLayout.Header>

			<PlayerLayout.Main className="py-4">
				{gamePhase === 'question-display' && currentQuestion && (
					<div className="overlay-blue">
						<h2 className="game-question-compact text-center">
							{currentQuestion.text}
						</h2>
					</div>
				)}

				{gamePhase === 'voting' && <VotingView interactive />}

				{gamePhase === 'results' && (
					<ResultsView
						playerWon={playerWon}
						playerEliminated={isSpectator}
						pointsEarned={
							playerWon
								? Math.round(
										config.baseScorePoints *
											(currentVote?.confidence ?? 1) *
											Math.min(
												(100 -
													((Math.max(...Object.values(voteAggregation), 0) -
														Math.max(
															...Object.values(voteAggregation).filter(
																(c) =>
																	c <
																	Math.max(...Object.values(voteAggregation), 0)
															),
															0
														)) /
														Object.values(voteAggregation).reduce(
															(a, b) => a + b,
															0
														)) *
														100) /
													50,
												2
											)
									)
								: 0
						}
					/>
				)}

				{gamePhase === 'lobby' && <GameLobbyView isGameActive={started} />}

				{gamePhase === 'game-over' && (
					<div className="space-y-4">
						<div className="overlay-purple text-center">
							<h2 className="mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
								🏆 Game Over!
							</h2>
						</div>

						{/* Leaderboard */}
						<div className="overlay-green">
							<h3 className="mb-3 font-semibold text-slate-900">
								Final Leaderboard
							</h3>
							<div className="space-y-2">
								{Object.entries(players)
									.map(([, p]) => ({
										name: p.name,
										score: p.score,
										isSpectator: p.isSpectator
									}))
									.sort((a, b) => b.score - a.score)
									.map((player, index) => (
										<div
											key={player.name}
											className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"
										>
											<div className="flex items-center gap-3">
												<span className="text-xl font-bold text-slate-400">
													{index + 1}.
												</span>
												<span className="font-semibold text-slate-900">
													{player.name}
												</span>
												{player.isSpectator && (
													<span className="text-xs text-red-600">
														eliminated
													</span>
												)}
											</div>
											<span className="text-lg font-bold text-slate-900">
												{player.score} pts
											</span>
										</div>
									))}
							</div>
						</div>
					</div>
				)}
			</PlayerLayout.Main>

			<PlayerLayout.Footer>
				<NameLabel name={name} />
			</PlayerLayout.Footer>
		</PlayerLayout.Root>
	);
};

const TopicSubmissionForm: React.FC<{
	playerName: string;
	hasSubmitted: boolean;
}> = ({ playerName, hasSubmitted }) => {
	const [topic, setTopic] = React.useState('');
	const [submitted, setSubmitted] = React.useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!topic.trim() || hasSubmitted) return;

		try {
			await globalActions.submitPlayerTopic(topic, playerName);
			setSubmitted(true);
			setTopic('');

			// Reset submitted message after 3 seconds
			setTimeout(() => {
				setSubmitted(false);
			}, 3000);
		} catch (error) {
			console.error('Failed to submit topic:', error);
		}
	};

	if (hasSubmitted) {
		return (
			<div className="overlay-amber text-center">
				<h3 className="mb-2 font-semibold text-slate-900">
					{config.playerSubmitTopicTitle}
				</h3>
				<p className="text-sm text-slate-600">
					{config.playerAlreadySubmittedMessage}
				</p>
			</div>
		);
	}

	return (
		<div className="overlay-amber">
			<h3 className="mb-3 font-semibold text-slate-900">
				{config.playerSubmitTopicTitle}
			</h3>

			{submitted && (
				<div className="mb-4 rounded-lg bg-green-100 p-3 text-center font-semibold text-green-700">
					{config.playerTopicSubmittedMessage}
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-3">
				<input
					type="text"
					value={topic}
					onChange={(e) => setTopic(e.target.value)}
					placeholder={config.playerSubmitTopicPlaceholder}
					className="km-input"
					maxLength={100}
				/>
				<button
					type="submit"
					disabled={!topic.trim()}
					className="km-btn-primary w-full"
				>
					{config.playerSubmitTopicButton}
				</button>
			</form>
		</div>
	);
};

export default withKmProviders(App);
