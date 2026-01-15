import { PlayerMenu } from '@/components/menu';
import { NameLabel } from '@/components/name-label';
import { withKmProviders } from '@/components/with-km-providers';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { PlayerLayout } from '@/layouts/player';
import { kmClient } from '@/services/km-client';
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
		votes
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

				<PlayerLayout.Main>
					<div className="w-full space-y-6">
						<div className="game-card text-center">
							<h2 className="mb-4 text-2xl font-bold text-slate-900">
								{config.preGameWelcome.replace('{name}', name)}
							</h2>
							<p className="text-lg text-slate-700">
								{config.preGameWaitingMessage}
							</p>
							<p className="mt-4 text-sm text-slate-600">
								{config.preGameInstructions}
							</p>
						</div>
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

			<PlayerLayout.Main>
				{gamePhase === 'question-display' && currentQuestion && (
					<div className="game-card">
						<h2 className="game-question text-center">
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
					<div className="space-y-6">
						<div className="game-card text-center">
							<h2 className="game-question text-success mb-2">🏆 Game Over!</h2>
						</div>

						{/* Leaderboard */}
						<div className="game-card">
							<h3 className="mb-4 font-semibold text-slate-900">
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

export default withKmProviders(App);
