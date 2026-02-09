import { CircularTimer } from '@/components/circular-timer';
import { ConfidenceSlider } from '@/components/confidence-slider';
import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { useSnapshot } from '@kokimoki/app';
import { AlertTriangle } from 'lucide-react';
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

	// Compute warning state directly from time remaining
	const timeRemaining = votingEndTimestamp - serverTime;
	const showAutoSubmitWarning =
		interactive &&
		!submitted &&
		selectedOption !== null &&
		timeRemaining <= 5000 &&
		timeRemaining > 0;

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

	// Handle option selection and auto-submit
	const handleOptionSelect = React.useCallback(
		async (index: number) => {
			if (!interactive || submitted) return;
			setSelectedOption(index);
			await globalActions.submitVote(index, confidence);
		},
		[interactive, submitted, confidence]
	);

	if (!currentQuestion) {
		return (
			<div className="text-center text-slate-600">
				{config.votingNoQuestionMessage}
			</div>
		);
	}

	const optionLetters = ['A', 'B', 'C'];
	const displayTimeRemaining = Math.max(0, timeRemaining);
	const totalVotingTime = config.votingDurationSeconds * 1000;

	return (
		<div className="phase-enter space-y-4">
			{/* Auto-submit Warning */}
			{showAutoSubmitWarning && !submitted && (
				<div className="animate-pulse rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-center shadow-lg shadow-amber-100/30">
					<div className="flex items-center justify-center gap-2">
						<AlertTriangle className="size-5 text-amber-600" />
						<span className="font-semibold text-amber-800">
							{config.votingAutoSubmitWarning}
						</span>
					</div>
				</div>
			)}

			{/* Question */}
			<div className="overlay-blue">
				<h2 className="game-question-compact text-center">
					{currentQuestion.text}
				</h2>
			</div>

			{/* Circular Timer */}
			{votingEndTimestamp > 0 && (
				<div className="flex justify-center">
					<CircularTimer
						ms={displayTimeRemaining}
						totalMs={totalVotingTime}
						size={100}
						strokeWidth={8}
					/>
				</div>
			)}

			{/* Options */}
			<div className="space-y-3">
				{currentQuestion.options.map((option, index) => (
					<button
						key={index}
						type="button"
						data-option={index}
						onClick={() => handleOptionSelect(index)}
						disabled={!interactive || submitted}
						className={cn(
							'vote-option-button',
							selectedOption === index && 'selected',
							!interactive && 'opacity-50'
						)}
					>
						<span className="option-letter" data-option={index}>
							{optionLetters[index]}
						</span>
						<span className="text-base">{option}</span>
					</button>
				))}
			</div>

			{/* Confidence Slider - only show during voting phase */}
			{interactive && votingEndTimestamp > 0 && !submitted && (
				<ConfidenceSlider
					value={confidence}
					onChange={setConfidence}
					disabled={submitted}
				/>
			)}

			{/* Submitted confirmation */}
			{submitted && interactive && (
				<div className="animate-slide-up rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50/80 to-green-50/80 px-4 py-3 text-center font-semibold text-green-700 shadow-lg shadow-emerald-100/30 backdrop-blur-md">
					{config.votingSubmittedMessage}
				</div>
			)}
		</div>
	);
};
