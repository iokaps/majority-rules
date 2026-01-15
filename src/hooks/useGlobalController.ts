import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { useEffect } from 'react';
import { useServerTimer } from './useServerTime';

/**
 * Hook to control and modify the global state
 * @returns A boolean indicating if the current client is the global controller
 */
export function useGlobalController() {
	const { controllerConnectionId, gamePhase, votingEndTimestamp } = useSnapshot(
		globalStore.proxy
	);
	const connections = useSnapshot(globalStore.connections);
	const connectionIds = connections.connectionIds;
	const isGlobalController = controllerConnectionId === kmClient.connectionId;
	const serverTime = useServerTimer(1000); // tick every second

	// Maintain connection that is assigned to be the global controller
	useEffect(() => {
		// Check if global controller is online
		if (connectionIds.has(controllerConnectionId)) {
			return;
		}

		// Select new host, sorting by connection id
		kmClient
			.transact([globalStore], ([globalState]) => {
				const connectionIdsArray = Array.from(connectionIds);
				connectionIdsArray.sort();
				globalState.controllerConnectionId = connectionIdsArray[0] || '';
			})
			.then(() => {})
			.catch(() => {});
	}, [connectionIds, controllerConnectionId]);

	// Run global controller-specific logic
	useEffect(() => {
		if (!isGlobalController) {
			return;
		}

		// Auto-reveal results when voting timer expires
		if (gamePhase === 'voting' && serverTime >= votingEndTimestamp) {
			globalActions.revealResults().catch((error) => {
				console.error('Failed to auto-reveal results:', error);
			});
		}
	}, [isGlobalController, serverTime, gamePhase, votingEndTimestamp]);

	return isGlobalController;
}
