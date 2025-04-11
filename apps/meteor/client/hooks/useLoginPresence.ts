import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { ServerContext, useConnectionStatus, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';

import { useIdleDetection } from './useIdleDetection';

export const useLoginPresence = () => {
	const uid = useUserId();
	const { status } = useConnectionStatus();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const { disconnect: disconnectServer, reconnect: reconnectServer } = useContext(ServerContext);

	const disconnect = useEffectEvent(() => {
		if (status === 'offline') {
			if (!uid && allowAnonymousRead !== true) {
				disconnectServer();
			}
		}
	});

	const reconnect = useEffectEvent(() => {
		if (status === 'offline') {
			reconnectServer();
		}
	});

	useIdleDetection(disconnect, { onActive: reconnect });
};
