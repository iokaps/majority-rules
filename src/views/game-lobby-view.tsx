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
		const activePlayers = Object.values(players).filter(
			(p) => !p.isSpectator
		).length;
		const eliminatedPlayers = Object.values(players).filter(
			(p) => p.isSpectator
		).length;

		if (!currentPlayer) {
			return (
				<div className="game-card text-center">
					<p className="text-slate-600">{config.lobbyLoadingMessage}</p>
				</div>
			);
		}

		return (
			<div className="w-full space-y-4">
				<div className="overlay-blue">
					<h2 className="mb-4 text-center text-xl font-bold text-slate-900">
						{config.lobbyCurrentStatus}
					</h2>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="font-semibold text-slate-700">
								{config.lobbyRoundLabel}
							</span>
							<span className="text-xl font-bold text-blue-600">
								{roundNumber}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="font-semibold text-slate-700">
								{config.lobbyYourScoreLabel}
							</span>
							<span className="text-xl font-bold text-slate-900">
								{currentPlayer.score} {config.lobbyPointsLabel}
							</span>
						</div>
						{!currentPlayer.isSpectator && (
							<div className="flex items-center justify-between">
								<span className="font-semibold text-slate-700">
									{config.lobbyLivesLabel}
								</span>
								<span className="text-xl">
									{'❤️'.repeat(currentPlayer.lives)}
								</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="font-semibold text-slate-700">
								{config.lobbyActivePlayersLabel}
							</span>
							<span className="text-xl font-bold text-green-700">
								{activePlayers}
							</span>
						</div>
						{eliminatedPlayers > 0 && (
							<div className="flex items-center justify-between">
								<span className="font-semibold text-slate-700">
									{config.lobbyEliminatedLabel}
								</span>
								<span className="text-xl font-bold text-red-600">
									{eliminatedPlayers}
								</span>
							</div>
						)}
					</div>
				</div>

				<div className="overlay-purple text-center">
					<p className="text-lg font-semibold text-slate-900">
						{config.lobbyWaitingTitle}
					</p>
					<p className="mt-2 text-sm text-slate-700">
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
