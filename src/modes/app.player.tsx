import { PlayerMenu } from '@/components/menu';
import { NameLabel } from '@/components/name-label';
import { withKmProviders } from '@/components/with-km-providers';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { PlayerLayout } from '@/layouts/player';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { playerStore } from '@/state/stores/player-store';
import { CreateProfileView } from '@/views/create-profile-view';
import { GameLobbyView } from '@/views/game-lobby-view';
import { ResultsView } from '@/views/results-view';
import { VotingView } from '@/views/voting-view';
import { useSnapshot } from '@kokimoki/app';
import { KmPodiumTable, useKmConfettiContext } from '@kokimoki/shared';
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
		playerTopics,
		roundPoints
	} = useSnapshot(globalStore.proxy);

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

	const { triggerConfetti } = useKmConfettiContext();

	// Trigger massive confetti for top 3 on game over
	React.useEffect(() => {
		if (gamePhase === 'game-over') {
			const playerRank = Object.values(players)
				.sort((a, b) => b.score - a.score)
				.findIndex((p) => p.name === name);
			if (playerRank >= 0 && playerRank < 3) {
				triggerConfetti({ preset: 'massive' });
			}
		}
	}, [gamePhase, players, name, triggerConfetti]);

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
				{gamePhase === 'voting' && <VotingView interactive />}

				{gamePhase === 'results' && (
					<div className="w-full space-y-4">
						<ResultsView
							playerWon={playerWon}
							pointsEarned={roundPoints[kmClient.id] || 0}
						/>
						<div className="overlay-blue text-center">
							<p className="text-sm text-slate-600">
								{config.playerResultsWaitingMessage}
							</p>
						</div>
					</div>
				)}

				{gamePhase === 'game-over' && (
					<div className="mx-auto w-full max-w-md space-y-4">
						<div className="overlay-purple text-center">
							<h2 className="mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
								{config.playerGameOverTitle}
							</h2>
						</div>

						{/* Leaderboard */}
						<div className="overlay-green">
							<h3 className="mb-4 text-center font-semibold text-slate-900">
								{config.playerFinalLeaderboardTitle}
							</h3>
							<div className="space-y-3">
								{/* Podium */}
								<KmPodiumTable
									entries={Object.entries(players)
										.map(([clientId, p]) => ({
											id: clientId,
											name: p.name,
											points: p.score
										}))
										.sort((a, b) => b.points - a.points)}
									pointsLabel={config.playerPointsLabel}
									podiumSettings={{
										'0': {
											label: '🥇',
											className: 'bg-yellow-100 border-yellow-400'
										},
										'1': {
											label: '🥈',
											className: 'bg-slate-100 border-slate-400'
										},
										'2': {
											label: '🥉',
											className: 'bg-orange-100 border-orange-400'
										}
									}}
								/>

								{/* Rest of Players */}
								{Object.entries(players).length > 3 && (
									<div className="border-t border-green-200 pt-3">
										{Object.entries(players)
											.map(([, p]) => ({
												name: p.name,
												score: p.score
											}))
											.sort((a, b) => b.score - a.score)
											.slice(3)
											.map((p, idx) => (
												<div
													key={p.name}
													className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
												>
													<div className="flex items-center gap-2">
														<span className="text-sm font-bold text-slate-500">
															{idx + 4}.
														</span>
														<span className="text-sm font-semibold text-slate-900">
															{p.name}
														</span>
													</div>
													<span className="text-sm font-bold text-slate-900">
														{p.score}
													</span>
												</div>
											))}
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{gamePhase === 'lobby' && <GameLobbyView isGameActive={started} />}
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
