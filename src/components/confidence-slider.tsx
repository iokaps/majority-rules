import { config } from '@/config';
import { cn } from '@/utils/cn';
import * as React from 'react';

interface ConfidenceSliderProps {
	/** Current confidence value: 0 = Safe, 1 = Normal, 2 = Risky */
	value: number;
	/** Callback when value changes */
	onChange: (value: number) => void;
	/** Disable the control */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

const segments = [
	{
		value: 0,
		label: 'Safe',
		emoji: '🛡️',
		description: '+5 if right, no penalty',
		bg: 'bg-emerald-500',
		hover: 'hover:bg-emerald-100',
		text: 'text-emerald-700'
	},
	{
		value: 1,
		label: 'Normal',
		emoji: '⚖️',
		description: '+10 if right, -5 if wrong',
		bg: 'bg-blue-500',
		hover: 'hover:bg-blue-100',
		text: 'text-blue-700'
	},
	{
		value: 2,
		label: 'Risky',
		emoji: '🔥',
		description: '+30 if right, -15 if wrong',
		bg: 'bg-orange-500',
		hover: 'hover:bg-orange-100',
		text: 'text-orange-700'
	}
];

/**
 * Compact confidence segmented control for voting.
 * Displays three pill-style buttons: Safe, Normal, Risky.
 */
export const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({
	value,
	onChange,
	disabled = false,
	className
}) => {
	const selectedSegment = segments[value] || segments[1];

	return (
		<div className={cn('flex flex-col items-center gap-1', className)}>
			<div
				role="radiogroup"
				aria-label={config.votingConfidenceLabel.replace('{n}', '')}
				className="inline-flex gap-1.5 rounded-full bg-white/60 p-1 shadow-sm backdrop-blur-sm"
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
								'rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150',
								'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1',
								isSelected
									? cn(segment.bg, 'text-white shadow-md')
									: cn(
											'text-slate-500',
											!disabled && segment.hover,
											!disabled && `hover:${segment.text}`
										),
								disabled && 'cursor-not-allowed opacity-50'
							)}
						>
							<span>
								{segment.emoji} {segment.label}
							</span>
						</button>
					);
				})}
			</div>
			<p
				className={cn(
					'text-xs font-medium transition-colors duration-150',
					selectedSegment.text
				)}
			>
				{selectedSegment.emoji} {selectedSegment.description}
			</p>
		</div>
	);
};
