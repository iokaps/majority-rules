import { Logo } from '@/components/logo';
import { cn } from '@/utils/cn';
import * as React from 'react';

interface LayoutProps {
	children?: React.ReactNode;
	className?: string;
}

const HostPresenterRoot: React.FC<LayoutProps> = ({ children, className }) => (
	<div
		className={cn(
			'game-bg grid min-h-dvh grid-rows-[auto_1fr_auto]',
			className
		)}
	>
		{children}
	</div>
);

const HostPresenterHeader: React.FC<LayoutProps> = ({
	children,
	className
}) => (
	<header
		className={cn(
			'sticky top-0 z-10 border-b border-white/40 bg-white/60 shadow-lg shadow-slate-200/20 backdrop-blur-xl',
			className
		)}
	>
		<div className="container mx-auto flex items-center justify-between p-3">
			<Logo />
			{children}
		</div>
	</header>
);

const HostPresenterMain: React.FC<LayoutProps> = ({ children, className }) => (
	<main
		className={cn('container mx-auto flex items-center px-4 py-4', className)}
	>
		{children}
	</main>
);

const HostPresenterFooter: React.FC<LayoutProps> = ({
	children,
	className
}) => (
	<footer
		className={cn(
			'sticky bottom-0 z-10 border-t border-white/40 bg-white/60 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl',
			className
		)}
	>
		<div className="container mx-auto flex items-center justify-between p-3">
			{children}
		</div>
	</footer>
);

/**
 * Layout components for the `host` and `presenter` modes
 */
export const HostPresenterLayout = {
	Root: HostPresenterRoot,
	Header: HostPresenterHeader,
	Main: HostPresenterMain,
	Footer: HostPresenterFooter
};
