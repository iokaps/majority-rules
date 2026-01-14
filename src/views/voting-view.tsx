import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import React, { useCallback, useEffect, useState } from 'react';

interface VotingViewProps {
	interactive?: boolean;
}

export const VotingView: React.FC<VotingViewProps> = ({
	interactive = true
}) => {
	const { currentQuestion, votingEndTimestamp, votes } = useSnapshot(
		globalStore.proxy
	);
	const serverTime = useServerTimer(250);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [confidence, setConfidence] = useState(1);

	// Derive submitted state from votes - no setState in effects
	const submitted = !!votes[kmClient.id];

	// Auto-submit on deadline
	const handleSubmit = useCallback(async () => {
		if (!interactive || selectedOption === null || submitted) return;
		await globalActions.submitVote(selectedOption, confidence);
	}, [interactive, selectedOption, confidence, submitted]);

	// Auto-submit when time runs out
	useEffect(() => {
		if (!interactive || submitted) return;

		const timeRemaining = votingEndTimestamp - serverTime;
		if (timeRemaining <= 0 && selectedOption !== null) {
			handleSubmit();
		}
	}, [
		serverTime,
		votingEndTimestamp,
		interactive,
		selectedOption,
		submitted,
		handleSubmit
	]);

	if (!currentQuestion) {
		return <div className="text-center text-slate-600">No question loaded</div>;
	}

	const timeRemaining = votingEndTimestamp - serverTime;
	const isTimeRunningOut = timeRemaining < 5000;
	const optionLetters = ['A', 'B', 'C'];

	return (
		<div className="space-y-8">
			{/* Question */}
			<div className="game-card">
				<h2 className="game-question text-center">{currentQuestion.text}</h2>
			</div>

			{/* Options */}
			<div className="space-y-3">
				{currentQuestion.options.map((option, index) => (
					<button
						key={index}
						type="button"
						onClick={() =>
							interactive && !submitted && setSelectedOption(index)
						}
						disabled={!interactive || submitted}
						className={cn(
							'vote-option-button',
							`option-${index + 1}`,
							selectedOption === index && 'selected',
							!interactive && 'opacity-50'
						)}
					>
						<span className="text-lg font-bold">{optionLetters[index]}</span>
						<span>{option}</span>
					</button>
				))}
			</div>

			{/* Confidence Slider - only show during voting phase */}
			{interactive && votingEndTimestamp > 0 && !submitted && (
				<div className="space-y-3">
					<label className="confidence-slider-label block">
						How confident? {confidence}x points
					</label>
					<input
						type="range"
						min="1"
						max="3"
						step="1"
						value={confidence}
						onChange={(e) => setConfidence(parseInt(e.target.value))}
						className="confidence-slider"
					/>
					<div className="flex justify-between text-xs text-slate-600">
						<span>Not Sure</span>
						<span>Very Sure</span>
					</div>
				</div>
			)}

			{/* Submit Button - only show during voting, interactive mode */}
			{interactive && votingEndTimestamp > 0 && !submitted && (
				<button
					type="button"
					onClick={handleSubmit}
					disabled={selectedOption === null}
					className="km-btn-primary w-full"
				>
					Submit Vote
				</button>
			)}

			{/* Submitted confirmation */}
			{submitted && interactive && (
				<div className="rounded-xl bg-green-100 px-4 py-3 text-center font-semibold text-green-700">
					✓ Vote submitted!
				</div>
			)}
		</div>
	);
};
