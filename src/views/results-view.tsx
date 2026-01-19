import { config } from '@/config';
import { kmClient } from '@/services/km-client';
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
	const { currentQuestion, voteAggregation, votes } = useSnapshot(
		globalStore.proxy
	);
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

	// Get points color and icon based on earned points
	const getPointsDisplay = () => {
		if (pointsEarned > 0) {
			return { color: 'text-success', sign: '+', bg: 'bg-green-50' };
		} else if (pointsEarned < 0) {
			return { color: 'text-danger', sign: '', bg: 'bg-red-50' };
		} else {
			return { color: 'text-slate-600', sign: '±', bg: 'bg-slate-50' };
		}
	};

	const pointsDisplay = getPointsDisplay();

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
					const currentVote = votes[kmClient.id];
					const isPlayerVote = currentVote?.optionIndex === index;

					return (
						<div
							key={index}
							className={cn(
								'rounded-lg p-3 transition-all',
								isPlayerVote && 'border-2 border-blue-400 bg-blue-50'
							)}
						>
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{isPlayerVote && (
											<span className="text-lg font-bold text-blue-600">✓</span>
										)}
										<span
											className={cn(
												'font-semibold',
												isWinner ? 'text-success' : 'text-slate-700'
											)}
										>
											{option}
										</span>
									</div>
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
						</div>
					);
				})}
			</div>

			{/* Points Display */}
			<div
				className={cn(
					'rounded-xl border-2 p-6 text-center',
					pointsDisplay.bg,
					pointsDisplay.color === 'text-success'
						? 'border-green-300'
						: pointsDisplay.color === 'text-danger'
							? 'border-red-300'
							: 'border-slate-300'
				)}
			>
				<p className="mb-2 text-sm font-medium text-slate-600">
					{pointsEarned > 0
						? 'Points Earned'
						: pointsEarned < 0
							? 'Points Lost'
							: 'No Points'}
				</p>
				<p className={cn('text-5xl font-bold', pointsDisplay.color)}>
					{pointsDisplay.sign}
					{Math.abs(pointsEarned)}
				</p>
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
		</div>
	);
};
