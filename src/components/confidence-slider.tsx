import { config } from '@/config';
import { cn } from '@/utils/cn';
import * as React from 'react';

interface ConfidenceSliderProps {
	/** Current confidence value: 0 = 0.5x, 1 = 1x, 2 = 3x */
	value: number;
	/** Callback when value changes */
	onChange: (value: number) => void;
	/** Disable the slider */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

const segments = [
	{
		value: 0,
		pointsLabel: '+5 / 0',
		label: 'Safe',
		emoji: '🛡️',
		color: 'bg-emerald-500',
		hoverColor: 'hover:bg-emerald-400',
		activeColor: 'bg-emerald-600',
		ringColor: 'ring-emerald-400',
		textColor: 'text-emerald-700',
		description: '+5 if right, no penalty'
	},
	{
		value: 1,
		pointsLabel: '+10 / -5',
		label: 'Normal',
		emoji: '⚖️',
		color: 'bg-blue-500',
		hoverColor: 'hover:bg-blue-400',
		activeColor: 'bg-blue-600',
		ringColor: 'ring-blue-400',
		textColor: 'text-blue-700',
		description: '+10 if right, -5 if wrong'
	},
	{
		value: 2,
		pointsLabel: '+30 / -15',
		label: 'Risky',
		emoji: '🔥',
		color: 'bg-orange-500',
		hoverColor: 'hover:bg-orange-400',
		activeColor: 'bg-orange-600',
		ringColor: 'ring-orange-400',
		textColor: 'text-orange-700',
		description: '+30 if right, -15 if wrong'
	}
];

/**
 * Custom confidence slider with three distinct zones for voting confidence.
 * Replaces the native range input with a visually distinct segmented control.
 */
export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({
	value,
	onChange,
	disabled = false,
	className
}) => {
	const selectedSegment = segments[value] || segments[1];

	return (
		<div
			className={cn(
				'rounded-xl border-2 bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-all',
				disabled ? 'opacity-50' : '',
				selectedSegment.ringColor,
				value === 2 && !disabled && 'ring-2 ring-offset-2',
				className
			)}
		>
			{/* Header with current selection */}
			<div className="mb-4 text-center">
				<div className="mb-1 flex items-center justify-center gap-2">
					<span className="text-2xl">{selectedSegment.emoji}</span>
					<span
						className={cn(
							'text-xl font-bold transition-colors',
							selectedSegment.textColor
						)}
					>
						{selectedSegment.label}: {selectedSegment.pointsLabel}
					</span>
				</div>
				<p className="text-sm text-slate-600">{selectedSegment.description}</p>
			</div>

			{/* Segmented Control */}
			<div
				className="flex gap-2"
				role="radiogroup"
				aria-label={config.votingConfidenceLabel.replace('{n}', '')}
			>
				{segments.map((segment) => {
					const isSelected = value === segment.value;
					return (
						<button
							key={segment.value}
							type="button"
							role="radio"
							aria-checked={isSelected}
							onClick={() => !disabled && onChange(segment.value)}
							disabled={disabled}
							className={cn(
								'flex-1 rounded-lg py-3 font-semibold transition-all duration-200',
								'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
								segment.ringColor,
								isSelected
									? cn(
											segment.color,
											'scale-105 text-white shadow-lg',
											'ring-2 ring-offset-1',
											segment.ringColor
										)
									: cn(
											'bg-white text-slate-700 shadow-sm',
											!disabled && segment.hoverColor,
											!disabled && 'hover:text-white hover:shadow-md'
										),
								!disabled && !isSelected && 'active:scale-95',
								disabled && 'cursor-not-allowed'
							)}
						>
							<div className="flex flex-col items-center gap-1">
								<span className="text-lg">{segment.emoji}</span>
								<span className="text-xs font-medium">{segment.label}</span>
							</div>
						</button>
					);
				})}
			</div>

			{/* Labels */}
			<div className="mt-3 flex justify-between text-xs text-slate-500">
				<span>{config.votingConfidenceMin}</span>
				<span>{config.votingConfidenceMax}</span>
			</div>
		</div>
	);
};
