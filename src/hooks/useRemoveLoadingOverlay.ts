import * as React from 'react';

export function useRemoveLoadingOverlay() {
	React.useEffect(() => {
		document.getElementById('connecting')?.remove();
		document.getElementById('km-loading')?.remove();
	}, []);
}
