import { cn } from '@/utils/cn';
import * as React from 'react';

interface CircularTimerProps {
	/** Time remaining in milliseconds */
	ms: number;
	/** Total duration in milliseconds */
	totalMs: number;
	/** Size of the timer in pixels */
	size?: number;
	/** Stroke width in pixels */
	strokeWidth?: number;
	/** Additional CSS classes */
	className?: string;
	/** Show the time text inside */
	showTime?: boolean;
}

/**
 * Circular progress timer with color transitions based on time remaining.
 * - Blue (>10s remaining): Normal state
 * - Yellow (5-10s remaining): Warning state
 * - Red (<5s remaining): Urgent state with pulse animation
 */
export const CircularTimer: React.FC<CircularTimerProps> = ({
	ms,
	totalMs,
	size = 120,
	strokeWidth = 8,
	className,
	showTime = true
}) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = Math.max(0, Math.min(1, ms / totalMs));
	const strokeDashoffset = circumference * (1 - progress);

	// Determine color state based on time remaining
	const seconds = Math.ceil(ms / 1000);
	const getColorState = () => {
		if (seconds <= 5) return 'urgent';
		if (seconds <= 10) return 'warning';
		return 'normal';
	};

	const colorState = getColorState();

	const colors = {
		normal: {
			stroke: 'url(#gradient-blue)',
			text: 'text-indigo-600',
			glow: 'drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]'
		},
		warning: {
			stroke: 'url(#gradient-yellow)',
			text: 'text-amber-600',
			glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'
		},
		urgent: {
			stroke: 'url(#gradient-red)',
			text: 'text-red-600',
			glow: 'timer-urgent-glow'
		}
	};

	const currentColors = colors[colorState];

	// Format time display
	const formatTime = () => {
		const totalSeconds = Math.ceil(ms / 1000);
		const mins = Math.floor(totalSeconds / 60);
		const secs = totalSeconds % 60;
		if (mins > 0) {
			return `${mins}:${secs.toString().padStart(2, '0')}`;
		}
		return secs.toString();
	};

	return (
		<div
			className={cn(
				'relative inline-flex items-center justify-center',
				colorState === 'urgent' && 'animate-timer-pulse',
				currentColors.glow,
				className
			)}
			style={{ width: size, height: size }}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="rotate-[-90deg]"
			>
				{/* Gradient definitions */}
				<defs>
					<linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#6366f1" />
						<stop offset="100%" stopColor="#3b82f6" />
					</linearGradient>
					<linearGradient
						id="gradient-yellow"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="0%"
					>
						<stop offset="0%" stopColor="#f59e0b" />
						<stop offset="100%" stopColor="#fbbf24" />
					</linearGradient>
					<linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor="#ef4444" />
						<stop offset="100%" stopColor="#dc2626" />
					</linearGradient>
				</defs>

				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="currentColor"
					strokeWidth={strokeWidth}
					className="text-slate-200"
				/>

				{/* Progress circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={currentColors.stroke}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					className="transition-all duration-300 ease-linear"
				/>
			</svg>

			{/* Time display */}
			{showTime && (
				<div
					className={cn(
						'absolute inset-0 flex items-center justify-center font-bold transition-colors duration-300',
						currentColors.text
					)}
					style={{ fontSize: size * 0.28 }}
				>
					{formatTime()}
				</div>
			)}
		</div>
	);
};
