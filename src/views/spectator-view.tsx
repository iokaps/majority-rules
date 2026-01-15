import { config } from '@/config';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

export const SpectatorView: React.FC = () => {
	const { currentQuestion, voteAggregation, gamePhase, players } = useSnapshot(
		globalStore.proxy
	);

	// Get sorted leaderboard
	const leaderboard = Object.entries(players)
		.map(([clientId, player]) => ({
			clientId,
			...player
		}))
		.sort((a, b) => b.score - a.score);

	const hasResults =
		gamePhase === 'results' && Object.keys(voteAggregation).length > 0;
	const totalVotes = Object.values(voteAggregation).reduce((a, b) => a + b, 0);
	const maxVotes = Math.max(...Object.values(voteAggregation), 0);
	const winningIndices = Object.entries(voteAggregation)
		.filter(([, count]) => count === maxVotes && maxVotes > 0)
		.map(([index]) => parseInt(index, 10));

	return (
		<div className="space-y-6">
			{/* Eliminated Badge */}
			<div className="overlay-amber text-center">
				<div className="spectator-badge pulse mx-auto justify-center">
					⚠️ You&apos;ve Been Eliminated
				</div>
				<p className="mt-3 text-sm text-slate-700">
					You can still watch the game!
				</p>
			</div>

			{/* Question Display */}
			{currentQuestion && (
				<div className="overlay-blue">
					<h2 className="game-question-compact text-center">
						{currentQuestion.text}
					</h2>
				</div>
			)}

			{/* Vote Results (after reveal) */}
			{hasResults && currentQuestion && (
				<div className="space-y-3">
					<h3 className="font-semibold text-slate-900">Results:</h3>
					{currentQuestion.options.map((option, index) => {
						const voteCount = voteAggregation[index] || 0;
						const percentage =
							totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
						const isWinner = winningIndices.includes(index);

						return (
							<div key={index} className="space-y-1">
								<div className="flex items-center justify-between">
									<span
										className={cn(
											'font-semibold',
											isWinner ? 'text-success' : 'text-slate-700'
										)}
									>
										{option}
									</span>
									<span className="text-sm text-slate-600">
										{voteCount} votes ({percentage.toFixed(0)}%)
									</span>
								</div>
								<div className="h-3 w-full rounded-full bg-slate-200">
									<div
										className={cn(
											'h-full rounded-full',
											isWinner ? 'bg-success' : 'bg-danger'
										)}
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Elimination Message */}
			<div className="border-danger rounded-2xl border-2 bg-red-50 p-6">
				<div className="prose prose-sm text-danger max-w-none">
					<ReactMarkdown>{config.eliminatedMessageMd}</ReactMarkdown>
				</div>
			</div>

			{/* Leaderboard */}
			<div className="space-y-2">
				<h3 className="font-semibold text-slate-900">Leaderboard:</h3>
				<div className="rounded-xl border border-slate-200 bg-white p-4">
					{leaderboard.map((player, index) => (
						<div
							key={player.clientId}
							className={cn(
								'leaderboard-row flex items-center justify-between px-4 py-3',
								player.isSpectator && 'opacity-60'
							)}
						>
							<div className="flex items-center gap-3">
								<span className="font-bold text-slate-600">#{index + 1}</span>
								<span className="font-semibold text-slate-900">
									{player.name}
									{player.isSpectator && (
										<span className="ml-2 text-xs text-red-600">
											\(Spectator\)
										</span>
									)}
								</span>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-right">
									<div className="font-bold text-slate-900">{player.score}</div>
									<div className="text-xs text-slate-600">points</div>
								</div>
								<div className="text-right">
									<div
										className={cn(
											'font-bold',
											player.lives > 0 ? 'text-success' : 'text-danger'
										)}
									>
										{player.lives}
									</div>
									<div className="text-xs text-slate-600">lives</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
