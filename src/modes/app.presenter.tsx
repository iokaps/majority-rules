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
		votingEndTimestamp,
		votes
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

	// Count of players and votes for display
	const totalPlayers = allPlayers.length;
	const votedCount = Object.keys(votes).length;

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
					{/* Game Over - Full centered layout */}
					{gamePhase === 'game-over' && (
						<div className="phase-enter mx-auto w-full max-w-2xl space-y-6">
							{/* Winner Announcement */}
							<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 p-8 text-center shadow-2xl">
								<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_50%)]" />
								<div className="relative">
									<div className="mb-2 text-6xl">🏆</div>
									<h2 className="mb-2 text-4xl font-black text-white drop-shadow-lg">
										{config.presenterGameOverTitle}
									</h2>
									<div className="mt-4 inline-block rounded-xl bg-white/90 px-6 py-3 shadow-lg backdrop-blur-sm">
										<p className="text-2xl font-bold text-slate-900">
											{allPlayers[0]?.name || 'Unknown'}
										</p>
										<p className="text-lg font-semibold text-amber-600">
											{allPlayers[0]?.score?.toLocaleString() || 0}{' '}
											{config.presenterPointsLabel}
										</p>
									</div>
								</div>
							</div>

							{/* Full Leaderboard */}
							<div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-xl">
								<h3 className="mb-6 text-center text-xl font-bold text-slate-800">
									{config.presenterLeaderboardTitle}
								</h3>

								{/* Top 3 Podium */}
								<div className="mb-6 flex items-end justify-center gap-4">
									{/* 2nd Place */}
									{allPlayers[1] && (
										<div className="flex flex-col items-center">
											<div className="mb-2 text-4xl">🥈</div>
											<div className="flex h-24 w-28 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-slate-300 to-slate-400 shadow-lg">
												<p className="truncate px-2 text-center text-sm font-bold text-white drop-shadow">
													{allPlayers[1].name}
												</p>
												<p className="text-lg font-black text-white drop-shadow">
													{allPlayers[1].score}
												</p>
											</div>
										</div>
									)}
									{/* 1st Place */}
									{allPlayers[0] && (
										<div className="flex flex-col items-center">
											<div className="mb-2 text-5xl">🥇</div>
											<div className="flex h-32 w-32 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-yellow-400 to-amber-500 shadow-xl ring-4 ring-yellow-300/50">
												<p className="truncate px-2 text-center font-bold text-white drop-shadow">
													{allPlayers[0].name}
												</p>
												<p className="text-2xl font-black text-white drop-shadow">
													{allPlayers[0].score}
												</p>
											</div>
										</div>
									)}
									{/* 3rd Place */}
									{allPlayers[2] && (
										<div className="flex flex-col items-center">
											<div className="mb-2 text-4xl">🥉</div>
											<div className="flex h-20 w-28 flex-col items-center justify-center rounded-t-xl bg-gradient-to-b from-orange-400 to-orange-500 shadow-lg">
												<p className="truncate px-2 text-center text-sm font-bold text-white drop-shadow">
													{allPlayers[2].name}
												</p>
												<p className="text-lg font-black text-white drop-shadow">
													{allPlayers[2].score}
												</p>
											</div>
										</div>
									)}
								</div>

								{/* Rest of Players */}
								{allPlayers.length > 3 && (
									<div className="space-y-2">
										{allPlayers.slice(3).map((player, idx) => (
											<div
												key={player.clientId}
												className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-3 transition-colors hover:bg-slate-200"
											>
												<div className="flex items-center gap-3">
													<span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-700">
														{idx + 4}
													</span>
													<span className="font-semibold text-slate-800">
														{player.name}
													</span>
												</div>
												<span className="font-bold text-slate-700">
													{player.score} {config.presenterPointsLabel}
												</span>
											</div>
										))}
									</div>
								)}

								{/* Total Players */}
								<div className="mt-6 text-center text-sm text-slate-500">
									{config.presenterPlayersParticipated.replace(
										'{count}',
										totalPlayers.toString()
									)}
								</div>
							</div>
						</div>
					)}

					{/* Active Game - Centered content with optional sidebar */}
					{gamePhase !== 'game-over' && (
						<div className="relative flex w-full items-start justify-center">
							{/* Main Content - Always centered */}
							<div className="w-full max-w-2xl space-y-6">
								{/* Waiting for game to start */}
								{!started && (
									<div className="flex flex-col items-center justify-center py-12">
										<div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-12 py-10 text-center shadow-lg">
											<div className="mb-4 text-5xl">🎮</div>
											<p className="text-2xl font-bold text-slate-800">
												{config.presenterWaitingToStartMessage}
											</p>
											{totalPlayers > 0 && (
												<p className="mt-3 text-lg text-slate-600">
													{totalPlayers} player{totalPlayers !== 1 ? 's' : ''}{' '}
													connected
												</p>
											)}
										</div>
									</div>
								)}

								{/* Waiting for next round */}
								{started && gamePhase === 'lobby' && (
									<div className="flex flex-col items-center justify-center py-12">
										<div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-12 py-10 text-center shadow-lg">
											<div className="mb-4 text-5xl">⏳</div>
											<p className="text-2xl font-bold text-slate-800">
												{config.presenterWaitingForRoundMessage}
											</p>
										</div>
									</div>
								)}

								{/* Question Display */}
								{started &&
									currentQuestion &&
									(gamePhase === 'voting' || gamePhase === 'results') && (
										<div className="overlay-purple">
											<h1 className="game-question mb-4 text-center">
												{currentQuestion.text}
											</h1>
											{gamePhase === 'voting' && (
												<div className="flex flex-col items-center gap-4">
													<CircularTimer
														ms={timeRemaining}
														totalMs={totalVotingTime}
														size={140}
														strokeWidth={10}
													/>
													{totalPlayers > 0 && (
														<div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm">
															<div className="flex items-center gap-1">
																<span className="text-lg font-bold text-slate-900">
																	{votedCount}
																</span>
																<span className="text-slate-600">/</span>
																<span className="text-lg font-bold text-slate-900">
																	{totalPlayers}
																</span>
															</div>
															<span className="text-sm text-slate-600">
																{config.presenterPlayersVotingLabel}
															</span>
														</div>
													)}
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

												// Option-specific gradient colors
												const getBarGradient = () => {
													if (isWinner) {
														switch (index) {
															case 0:
																return 'bg-gradient-to-r from-blue-400 to-indigo-500';
															case 1:
																return 'bg-gradient-to-r from-green-400 to-emerald-500';
															case 2:
																return 'bg-gradient-to-r from-orange-400 to-amber-500';
															default:
																return 'gradient-success';
														}
													} else {
														return 'bg-slate-300';
													}
												};

												return (
													<div key={index}>
														<div className="mb-2 flex items-center justify-between">
															<span
																className={cn(
																	'text-lg font-semibold',
																	isWinner ? 'text-success' : 'text-slate-900'
																)}
															>
																{option}
																{isWinner && ' ✓'}
															</span>
															<span
																className={cn(
																	'animate-count-fade text-xl font-bold',
																	isWinner ? 'text-success' : 'text-slate-600'
																)}
															>
																{voteCount} ({percentage.toFixed(0)}%)
															</span>
														</div>
														<div className="h-8 w-full rounded-lg bg-slate-200">
															<div
																className={cn(
																	'results-bar h-full rounded-lg',
																	getBarGradient(),
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
							</div>

							{/* Leaderboard Sidebar - Fixed position on right */}
							{allPlayers.length > 0 && (
								<div className="ml-6 hidden w-72 flex-shrink-0 xl:block">
									<div className="overlay-green sticky top-24">
										<h2 className="mb-4 text-lg font-semibold text-slate-900">
											{config.presenterLeaderboardTitle} ({totalPlayers})
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
					)}

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
