import { config } from '@/config';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

interface ResultsViewProps {
	playerWon: boolean;
	playerEliminated?: boolean;
	pointsEarned?: number;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
	playerWon,
	playerEliminated = false,
	pointsEarned = 0
}) => {
	const { currentQuestion, voteAggregation } = useSnapshot(globalStore.proxy);

	if (!currentQuestion) {
		return <div className="text-center text-slate-600">No question loaded</div>;
	}

	const maxVotes = Math.max(...Object.values(voteAggregation), 0);
	const totalVotes = Object.values(voteAggregation).reduce((a, b) => a + b, 0);

	// Determine winning options
	const winningIndices = Object.entries(voteAggregation)
		.filter(([, count]) => count === maxVotes && maxVotes > 0)
		.map(([index]) => parseInt(index, 10));

	return (
		<div className="space-y-8">
			{/* Question */}
			<div className="game-card">
				<h2 className="game-question text-center">{currentQuestion.text}</h2>
			</div>

			{/* Vote Breakdown */}
			<div className="space-y-3">
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
										'h-full rounded-full transition-all duration-500',
										isWinner ? 'bg-success' : 'bg-danger'
									)}
									style={{ width: `${percentage}%` }}
								/>
							</div>
						</div>
					);
				})}
			</div>

			{/* Result Message */}
			<div
				className={cn(
					'prose prose-sm max-w-none rounded-2xl p-6',
					playerWon
						? 'border-success border-2 bg-green-50'
						: 'border-danger border-2 bg-red-50'
				)}
			>
				<div className={playerWon ? 'text-success' : 'text-danger'}>
					<ReactMarkdown>
						{playerWon ? config.winnersMessageMd : config.losersMessageMd}
					</ReactMarkdown>
				</div>
			</div>

			{/* Points Display */}
			{pointsEarned > 0 && (
				<div className="score-notification text-center">
					<div className="text-success text-4xl font-bold">+{pointsEarned}</div>
					<div className="text-sm text-slate-600">points earned</div>
				</div>
			)}

			{/* Eliminated Message */}
			{playerEliminated && (
				<div className="border-danger rounded-2xl border-2 bg-red-50 p-6">
					<div className="spectator-badge pulse mb-3 justify-center">
						⚠️ Eliminated
					</div>
					<div className="prose prose-sm text-danger max-w-none">
						<ReactMarkdown>{config.eliminatedMessageMd}</ReactMarkdown>
					</div>
				</div>
			)}

			{/* Non-winner, not eliminated */}
			{!playerWon && !playerEliminated && (
				<div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
					Lost 1 life. {config.playerStartingLives - 1} remaining.
				</div>
			)}
		</div>
	);
};
