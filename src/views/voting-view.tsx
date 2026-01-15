import { config } from '@/config';
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
		return (
			<div className="text-center text-slate-600">
				{config.votingNoQuestionMessage}
			</div>
		);
	}

	const optionLetters = ['A', 'B', 'C'];

	return (
		<div className="space-y-6">
			{/* Question */}
			<div className="overlay-blue">
				<h2 className="game-question-compact text-center">
					{currentQuestion.text}
				</h2>
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
							!interactive && 'opacity-50',
							interactive && !submitted && 'hover:animate-pulse'
						)}
					>
						<span className="text-lg font-bold">{optionLetters[index]}</span>
						<span>{option}</span>
					</button>
				))}
			</div>

			{/* Confidence Slider - only show during voting phase */}
			{interactive && votingEndTimestamp > 0 && !submitted && (
				<div
					className={cn(
						'space-y-2 rounded-lg p-3 transition-all',
						confidence === 2 && 'ring-2 ring-orange-400 ring-offset-2'
					)}
				>
					<label className="confidence-slider-label block">
						{config.votingConfidenceLabel.replace(
							'{n}',
							confidence === 0 ? '🤔 0.5' : confidence === 1 ? '😐 1' : '😎 3'
						)}
					</label>
					<input
						type="range"
						min="0"
						max="2"
						step="1"
						value={confidence}
						onChange={(e) => setConfidence(parseInt(e.target.value))}
						className="confidence-slider"
					/>
					<div className="flex justify-between text-xs text-slate-600">
						<span>{config.votingConfidenceMin}</span>
						<span className="font-semibold">1x</span>
						<span>{config.votingConfidenceMax}</span>
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
					{config.votingSubmitButton}
				</button>
			)}

			{/* Submitted confirmation */}
			{submitted && interactive && (
				<div className="rounded-xl bg-green-100 px-4 py-3 text-center font-semibold text-green-700">
					{config.votingSubmittedMessage}
				</div>
			)}
		</div>
	);
};
