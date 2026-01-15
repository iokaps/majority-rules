import { config } from '@/config';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { useKmConfettiContext } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

interface ResultsViewProps {
	playerWon: boolean;
	pointsEarned?: number;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
	playerWon,
	pointsEarned = 0
}) => {
	const { currentQuestion, voteAggregation } = useSnapshot(globalStore.proxy);
	const { triggerConfetti } = useKmConfettiContext();

	// Trigger confetti immediately when player wins
	React.useEffect(() => {
		if (playerWon) {
			triggerConfetti();
		}
	}, [playerWon, triggerConfetti]);

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
		<div className="space-y-6">
			{/* Question */}
			<div className="overlay-blue">
				<h2 className="game-question-compact text-center">
					{currentQuestion.text}
				</h2>
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
										isWinner ? 'gradient-success' : 'gradient-danger'
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
					'prose prose-sm max-w-none',
					playerWon ? 'overlay-green' : 'overlay-amber',
					!playerWon && 'animate-shake'
				)}
			>
				<div className={playerWon ? 'text-success' : 'text-danger'}>
					<ReactMarkdown>
						{playerWon ? config.winnersMessageMd : config.losersMessageMd}
					</ReactMarkdown>
				</div>
			</div>

			{/* Points Display */}
			{playerWon && (
				<div className="score-notification text-center">
					<div className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-5xl font-bold text-transparent">
						+{pointsEarned}
					</div>
					<div className="text-sm text-slate-600">points earned</div>
				</div>
			)}
		</div>
	);
};
