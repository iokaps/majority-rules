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
import { KmQrCode } from '@kokimoki/shared';
import * as React from 'react';

const App: React.FC = () => {
	const { title } = config;
	const {
		started,
		showPresenterQr,
		gamePhase,
		currentQuestion,
		players,
		voteAggregation,
		votingEndTimestamp
	} = useSnapshot(globalStore.proxy);
	const serverTime = useServerTimer(250);

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

	// Vote breakdown
	const totalVotes = Object.values(voteAggregation).reduce((a, b) => a + b, 0);
	const maxVotes = Math.max(...Object.values(voteAggregation), 0);
	const winningIndices = Object.entries(voteAggregation)
		.filter(([, count]) => count === maxVotes && maxVotes > 0)
		.map(([index]) => parseInt(index, 10));

	// Timer
	const timeRemaining = Math.max(0, votingEndTimestamp - serverTime);
	const isTimeRunningOut = timeRemaining < 5000 && timeRemaining > 0;

	const hasVoteResults =
		gamePhase === 'results' && Object.keys(voteAggregation).length > 0;

	return (
		<>
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Header />

				<HostPresenterLayout.Main>
					<div className="grid gap-6 lg:grid-cols-[1fr_auto]">
						{/* Main Content */}
						<div className="space-y-6">
							{/* Question Display */}
							{started && currentQuestion && gamePhase !== 'game-over' && (
								<div className="overlay-purple">
									<h1 className="game-question mb-4 text-center">
										{currentQuestion.text}
									</h1>
									{gamePhase === 'voting' && (
										<div className="flex justify-center">
											<div
												className={cn(
													'rounded-full px-8 py-4 text-3xl font-bold shadow-lg',
													isTimeRunningOut
														? 'gradient-danger animate-pulse text-white'
														: 'gradient-blue text-white'
												)}
											>
												{Math.ceil(timeRemaining / 1000)}s
											</div>
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
																'text-xl font-bold',
																isWinner ? 'text-success' : 'text-danger'
															)}
														>
															{voteCount} ({percentage.toFixed(0)}%)
														</span>
													</div>
													<div className="h-8 w-full rounded-lg bg-slate-200">
														<div
															className={cn(
																'h-full rounded-lg transition-all duration-500',
																isWinner
																	? 'gradient-success'
																	: 'gradient-danger'
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

							{/* Full Player List */}
							{allPlayers.length > 0 && (
								<div className="overlay-green">
									<h2 className="mb-4 text-xl font-semibold text-slate-900">
										{config.presenterLeaderboardTitle}
									</h2>
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
										{allPlayers.map((player, index) => (
											<div
												key={player.clientId}
												className={cn(
													'flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md',
													index === 0 && 'ring-2 ring-yellow-400',
													index === 1 && 'ring-2 ring-slate-300',
													index === 2 && 'ring-2 ring-orange-400'
												)}
											>
												<div className="flex items-center gap-3">
													<span
														className={cn(
															'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
															index === 0 && 'bg-yellow-100 text-yellow-700',
															index === 1 && 'bg-slate-100 text-slate-700',
															index === 2 && 'bg-orange-100 text-orange-700',
															index > 2 && 'bg-slate-50 text-slate-600'
														)}
													>
														{index + 1}
													</span>
													<p className="text-base font-semibold text-slate-900">
														{player.name}
													</p>
												</div>
												<div className="text-right">
													<p className="text-2xl font-bold text-slate-900">
														{player.score}
													</p>
													<p className="text-xs text-slate-600">
														{config.presenterPointsLabel}
													</p>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Sidebar - QR Code Only */}
						{showPresenterQr && (
							<div className="flex justify-center lg:justify-start">
								<div className="game-card sticky top-20 flex justify-center">
									<KmQrCode data={playerLink} size={180} />
								</div>
							</div>
						)}
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		</>
	);
};

export default App;
