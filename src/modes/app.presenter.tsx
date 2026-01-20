import { CircularTimer } from '@/components/circular-timer';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { useServerTimer } from '@/hooks/useServerTime';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { KmPodiumTable, KmQrCode } from '@kokimoki/shared';
import * as React from 'react';

const App: React.FC = () => {
	const { title } = config;
	const {
		started,
		gamePhase,
		currentQuestion,
		players,
		voteAggregation,
		votingEndTimestamp
	} = useSnapshot(globalStore.proxy);
	const serverTime = useServerTimer(250);
	const [showQr, setShowQr] = React.useState(false);

	useGlobalController();
	useDocumentTitle(title);

	if (kmClient.clientContext.mode !== 'presenter') {
		throw new Error('App presenter rendered in non-presenter mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	// Get full player list (all players, not just top 3)
	const allPlayers = Object.entries(players)
		.map(([clientId, player]) => ({
			clientId,
			...player
		}))
		.sort((a, b) => b.score - a.score);

	// Check if anyone has scored points
	const hasAnyPoints = allPlayers.some((p) => p.score > 0);

	// Vote breakdown
	const totalVotes = Object.values(voteAggregation).reduce((a, b) => a + b, 0);
	const maxVotes = Math.max(...Object.values(voteAggregation), 0);
	const winningIndices = Object.entries(voteAggregation)
		.filter(([, count]) => count === maxVotes && maxVotes > 0)
		.map(([index]) => parseInt(index, 10));

	// Timer
	const timeRemaining = Math.max(0, votingEndTimestamp - serverTime);
	const totalVotingTime = config.votingDurationSeconds * 1000;

	const hasVoteResults =
		gamePhase === 'results' && Object.keys(voteAggregation).length > 0;

	return (
		<>
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header>
					{gamePhase !== 'game-over' && (
						<button
							type="button"
							onClick={() => setShowQr(!showQr)}
							className={cn(
								'km-btn-secondary text-sm',
								showQr && 'km-btn-primary'
							)}
						>
							{showQr ? 'Hide QR' : 'Show QR'}
						</button>
					)}
				</HostPresenterLayout.Header>

				<HostPresenterLayout.Main>
					<div
						className={cn(
							'grid gap-6',
							gamePhase !== 'game-over'
								? 'lg:grid-cols-[1fr_auto]'
								: 'mx-auto w-full max-w-2xl grid-cols-1'
						)}
					>
						{/* Main Content */}
						<div
							className={cn(
								'space-y-6',
								gamePhase === 'game-over' ? '' : 'mx-auto w-full max-w-2xl'
							)}
						>
							{/* Question Display */}
							{started && currentQuestion && gamePhase !== 'game-over' && (
								<div className="overlay-purple">
									<h1 className="game-question mb-4 text-center">
										{currentQuestion.text}
									</h1>
									{gamePhase === 'voting' && (
										<div className="flex justify-center">
											<CircularTimer
												ms={timeRemaining}
												totalMs={totalVotingTime}
												size={140}
												strokeWidth={10}
											/>
										</div>
									)}
								</div>
							)}

							{/* Vote Breakdown Bar Chart */}
							{started && currentQuestion && hasVoteResults && (
								<div className="overlay-blue">
									<h2 className="mb-4 text-xl font-semibold text-slate-900">
										{config.presenterVoteBreakdownTitle}
									</h2>
									<div className="space-y-4">
										{currentQuestion.options.map((option, index) => {
											const voteCount = voteAggregation[index] || 0;
											const percentage =
												totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
											const isWinner = winningIndices.includes(index);

											return (
												<div key={index}>
													<div className="mb-2 flex items-center justify-between">
														<span className="text-lg font-semibold text-slate-900">
															{option}
														</span>
														<span
															className={cn(
																'animate-count-fade text-xl font-bold',
																isWinner ? 'text-success' : 'text-danger'
															)}
														>
															{voteCount} ({percentage.toFixed(0)}%)
														</span>
													</div>
													<div className="h-8 w-full rounded-lg bg-slate-200">
														<div
															className={cn(
																'results-bar h-full rounded-lg',
																isWinner
																	? 'gradient-success'
																	: 'gradient-danger',
																index === 1 && 'results-bar-delay-1',
																index === 2 && 'results-bar-delay-2'
															)}
															style={{ width: `${percentage}%` }}
														/>
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Game Status Messages */}
							{!started && (
								<div className="game-card text-center">
									<p className="text-lg font-semibold text-slate-900">
										{config.presenterWaitingToStartMessage}
									</p>
								</div>
							)}

							{started && gamePhase === 'lobby' && (
								<div className="game-card text-center">
									<p className="text-lg font-semibold text-slate-900">
										{config.presenterWaitingForRoundMessage}
									</p>
								</div>
							)}

							{gamePhase === 'game-over' && (
								<div className="game-card text-center">
									<h2 className="game-question text-success mb-4">
										{config.presenterGameOverTitle}
									</h2>
									<p className="text-lg font-semibold text-slate-900">
										{config.presenterWinsWithPoints
											.replace('{name}', allPlayers[0]?.name || '')
											.replace(
												'{score}',
												allPlayers[0]?.score?.toString() || '0'
											)}
									</p>
								</div>
							)}
						</div>

						{/* Sidebar - Leaderboard */}
						{gamePhase !== 'game-over' && hasAnyPoints && (
							<div className="flex flex-col justify-start">
								<div className="overlay-green h-fit">
									<h2 className="mb-4 text-lg font-semibold text-slate-900">
										{config.presenterLeaderboardTitle}
									</h2>
									<div className="space-y-3">
										{/* Podium */}
										<KmPodiumTable
											entries={allPlayers.map((p) => ({
												id: p.clientId,
												name: p.name,
												points: p.score
											}))}
											pointsLabel={config.presenterPointsLabel}
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
										{allPlayers.length > 3 && (
											<div className="border-t border-green-200 pt-3">
												{allPlayers.slice(3).map((p, idx) => (
													<div
														key={p.clientId}
														className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
													>
														<div className="flex items-center gap-2">
															<span className="font-bold text-slate-500">
																{idx + 4}.
															</span>
															<span className="font-semibold text-slate-900">
																{p.name}
															</span>
														</div>
														<span className="font-bold text-slate-900">
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
					</div>

					{/* QR Code Overlay */}
					{showQr && gamePhase !== 'game-over' && (
						<div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
							<button
								type="button"
								onClick={() => setShowQr(false)}
								className="self-end rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
							>
								✕ Close
							</button>
							<div className="game-card rounded-2xl p-6 shadow-2xl">
								<KmQrCode data={playerLink} size={200} />
							</div>
						</div>
					)}
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		</>
	);
};

export default App;
