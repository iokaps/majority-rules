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
import { cn } from '@/utils/cn';
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
		playerTopicsSubmittedBy,
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
						<div className="overlay-blue animate-slide-up text-center">
							<h2 className="text-gradient-game mb-3 text-2xl font-extrabold">
								{config.preGameWelcome.replace('{name}', name)}
							</h2>
							<p className="mb-2 text-base font-medium text-slate-700">
								{config.preGameWaitingMessage}
							</p>
							<p className="text-sm text-slate-500">
								{config.preGameInstructions}
							</p>
						</div>

						{/* Topic Submission Form */}
						{playerTopicsEnabled && (
							<TopicSubmissionForm
								playerName={name}
								hasSubmitted={!!playerTopicsSubmittedBy[kmClient.id]}
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
					<div className="round-badge">
						Round {globalStore.proxy.roundNumber}
						{config.maxRounds > 0 && (
							<span className="text-sm font-medium text-white/80">
								/ {config.maxRounds}
							</span>
						)}
					</div>
				)}
			</PlayerLayout.Header>

			<PlayerLayout.Main className="py-4">
				{gamePhase === 'voting' && <VotingView interactive />}

				{gamePhase === 'results' && (
					<div className="phase-enter w-full space-y-4">
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
					<div className="phase-enter mx-auto w-full max-w-md space-y-4">
						<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 p-6 text-center shadow-2xl">
							<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
							<div className="relative">
								<h2 className="text-4xl font-black text-white drop-shadow-lg">
									{config.playerGameOverTitle}
								</h2>
							</div>
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
											name:
												clientId === kmClient.id
													? `⭐ ${p.name} (You)`
													: p.name,
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
											.map(([clientId, p]) => ({
												clientId,
												name: p.name,
												score: p.score
											}))
											.sort((a, b) => b.score - a.score)
											.slice(3)
											.map((p, idx) => {
												const isCurrentPlayer = p.clientId === kmClient.id;
												return (
													<div
														key={p.clientId}
														className={cn(
															'flex items-center justify-between rounded-lg px-3 py-2',
															isCurrentPlayer
																? 'bg-blue-100 ring-2 ring-blue-400'
																: 'bg-slate-50'
														)}
													>
														<div className="flex items-center gap-2">
															<span className="text-sm font-bold text-slate-500">
																{idx + 4}.
															</span>
															<span
																className={cn(
																	'text-sm font-semibold',
																	isCurrentPlayer
																		? 'text-blue-700'
																		: 'text-slate-900'
																)}
															>
																{isCurrentPlayer
																	? `⭐ ${p.name} (You)`
																	: p.name}
															</span>
														</div>
														<span
															className={cn(
																'text-sm font-bold',
																isCurrentPlayer
																	? 'text-blue-700'
																	: 'text-slate-900'
															)}
														>
															{p.score}
														</span>
													</div>
												);
											})}
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
