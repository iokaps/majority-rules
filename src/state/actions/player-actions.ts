import { kmClient } from '@/services/km-client';
import { globalStore } from '../stores/global-store';
import { playerStore, type PlayerState } from '../stores/player-store';

export const playerActions = {
	async setCurrentView(view: PlayerState['currentView']) {
		await kmClient.transact([playerStore], ([playerState]) => {
			playerState.currentView = view;
		});
	},

	async setPlayerName(name: string) {
		await kmClient.transact(
			[playerStore, globalStore],
			([playerState, globalState]) => {
				playerState.name = name;
				if (!globalState.players[kmClient.id]) {
					globalState.players[kmClient.id] = {
						name,
						score: 0,
						hasVoted: false
					};
				} else {
					globalState.players[kmClient.id].name = name;
				}
			}
		);
	}
};
