import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import React from 'react';
import Markdown from 'react-markdown';

interface GameLobbyViewProps {
	isGameActive?: boolean;
}

/**
 * View to display the game lobby information before the game starts
 * or game status during active game rounds
 */
export const GameLobbyView: React.FC<GameLobbyViewProps> = ({
	isGameActive = false
}) => {
	const { roundNumber, players } = useSnapshot(globalStore.proxy);

	// Show player stats during active game
	if (isGameActive) {
		const currentPlayer = players[kmClient.id];
		const totalPlayers = Object.values(players).length;

		if (!currentPlayer) {
			return (
				<div className="game-card text-center">
					<p className="text-slate-600">{config.lobbyLoadingMessage}</p>
				</div>
			);
		}

		return (
			<div className="animate-slide-up w-full space-y-4">
				<div className="overlay-blue">
					<h2 className="text-gradient-game mb-4 text-center text-xl font-bold">
						{config.lobbyCurrentStatus}
					</h2>
					<div className="space-y-3">
						<div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3">
							<span className="font-semibold text-slate-600">
								{config.lobbyRoundLabel}
							</span>
							<span className="text-xl font-black text-indigo-600">
								{roundNumber}
							</span>
						</div>
						<div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3">
							<span className="font-semibold text-slate-600">
								{config.lobbyYourScoreLabel}
							</span>
							<span className="text-xl font-black text-slate-900">
								{currentPlayer.score} {config.lobbyPointsLabel}
							</span>
						</div>
						<div className="flex items-center justify-between rounded-xl bg-white/50 px-4 py-3">
							<span className="font-semibold text-slate-600">
								{config.lobbyActivePlayersLabel}
							</span>
							<span className="text-xl font-black text-emerald-600">
								{totalPlayers}
							</span>
						</div>
					</div>
				</div>

				<div className="overlay-purple text-center">
					<p className="text-lg font-semibold text-slate-900">
						{config.lobbyWaitingTitle}
					</p>
					<p className="mt-2 text-sm text-slate-600">
						{config.lobbyWaitingMessage}
					</p>
				</div>
			</div>
		);
	}

	// Show markdown content before game starts
	return (
		<article className="prose">
			<Markdown>{config.gameLobbyMd}</Markdown>
		</article>
	);
};
