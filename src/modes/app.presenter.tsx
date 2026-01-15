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

	// Get leaderboard data
	const leaderboard = Object.entries(players)
		.map(([clientId, player]) => ({
			clientId,
			...player
		}))
		.sort((a, b) => b.score - a.score)
		.slice(0, 3);

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
					<div className="grid gap-6 lg:grid-cols-5">
						{/* Main Content */}
						<div className="space-y-6 lg:col-span-4">
							{/* Question Display */}
							{started && currentQuestion && (
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
									<h2 className="mb-4 font-semibold text-slate-900">
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
														<span className="font-semibold text-slate-900">
															{option}
														</span>
														<span
															className={cn(
																'text-lg font-bold',
																isWinner ? 'text-success' : 'text-danger'
															)}
														>
															{voteCount} ({percentage.toFixed(0)}%)
														</span>
													</div>
													<div className="h-6 w-full rounded-lg bg-slate-200">
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
										Waiting for game to start...
									</p>
								</div>
							)}

							{started && gamePhase === 'lobby' && (
								<div className="game-card text-center">
									<p className="text-lg font-semibold text-slate-900">
										Waiting for next round...
									</p>
								</div>
							)}

							{gamePhase === 'game-over' && (
								<div className="game-card text-center">
									<h2 className="game-question text-success mb-4">
										🏆 Game Over!
									</h2>
									<p className="text-lg font-semibold text-slate-900">
										{leaderboard[0]?.name} wins with {leaderboard[0]?.score}{' '}
										points!
									</p>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div className="space-y-4">
							{/* QR Code */}
							{showPresenterQr && (
								<div className="game-card flex justify-center">
									<KmQrCode data={playerLink} size={140} />
								</div>
							)}

							{/* Leaderboard */}
							<div className="overlay-green">
								<h2 className="mb-3 font-semibold text-slate-900">
									{config.presenterLeaderboardTitle}
								</h2>
								<div className="space-y-2">
									{leaderboard.map((player, index) => (
										<div
											key={player.clientId}
											className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
										>
											<div className="flex-1">
												<p className="text-sm font-semibold text-slate-900">
													{index + 1}. {player.name}
												</p>
											</div>
											<div className="text-right">
												<p className="text-lg font-bold text-slate-900">
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
						</div>
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		</>
	);
};

export default App;
