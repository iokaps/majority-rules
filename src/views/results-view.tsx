import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { useKmAnimatedValue, useKmConfettiContext } from '@kokimoki/shared';
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

	// Animated points display
	const { ref: pointsRef } = useKmAnimatedValue<HTMLSpanElement>(
		Math.abs(pointsEarned),
		0,
		{ duration: 0.8 }
	);

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

					// Get confidence multiplier display
					const getConfidenceLabel = () => {
						if (!currentVote) return null;
						const mult =
							currentVote.confidence === 0
								? '0.5'
								: currentVote.confidence === 1
									? '1'
									: '3';
						return `×${mult}`;
					};

					// Option-specific gradient colors
					const getBarGradient = () => {
						if (isWinner) {
							// Winner gets bright version of option color
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
							// Loser gets muted version
							return 'bg-slate-300';
						}
					};

					return (
						<div
							key={index}
							className={cn(
								'animate-slide-up rounded-xl p-3 transition-all',
								index === 0 && '',
								index === 1 && 'animate-slide-up-delay-1',
								index === 2 && 'animate-slide-up-delay-2',
								isPlayerVote && 'ring-2 ring-indigo-400 ring-offset-2',
								isPlayerVote && isWinner && 'bg-green-50/80',
								isPlayerVote && !isWinner && 'bg-red-50/80'
							)}
						>
							<div className="space-y-1">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{isPlayerVote && (
											<span className="rounded bg-blue-100 px-2 py-0.5 text-sm font-bold text-blue-600">
												You {getConfidenceLabel()}
											</span>
										)}
										<span
											className={cn(
												'font-semibold',
												isWinner ? 'text-success' : 'text-slate-700'
											)}
										>
											{option}
											{isWinner && ' ✓'}
										</span>
									</div>
									<span className="animate-count-fade text-sm text-slate-600">
										{voteCount} votes ({percentage.toFixed(0)}%)
									</span>
								</div>
								<div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
									<div
										className={cn(
											'results-bar h-full rounded-full',
											getBarGradient(),
											index === 1 && 'results-bar-delay-1',
											index === 2 && 'results-bar-delay-2'
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
					'points-earned overflow-hidden rounded-2xl border-2 p-6 text-center shadow-lg',
					pointsDisplay.bg,
					pointsDisplay.color === 'text-success'
						? 'border-green-300/60 shadow-green-100/50'
						: pointsDisplay.color === 'text-danger'
							? 'border-red-300/60 shadow-red-100/50'
							: 'border-slate-300/60'
				)}
			>
				<p className="mb-2 text-sm font-semibold tracking-wider text-slate-500 uppercase">
					{pointsEarned > 0
						? 'Points Earned'
						: pointsEarned < 0
							? 'Points Lost'
							: 'No Points'}
				</p>
				<p
					className={cn(
						'text-6xl font-black tabular-nums',
						pointsEarned > 0
							? 'points-positive'
							: pointsEarned < 0
								? 'points-negative'
								: 'points-neutral'
					)}
				>
					{pointsDisplay.sign}
					<span ref={pointsRef}>0</span>
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
