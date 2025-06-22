import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useSetting, usePermission, useRouter } from '@rocket.chat/ui-contexts';

import type { MessageActionConfig } from '../../../../app/ui-utils/client/lib/MessageAction';
import { useUnpinMessageMutation } from '../hooks/useUnpinMessageMutation';

export const useForwardTopicAction = (
	message: IMessage,
): MessageActionConfig | null => {
	console.log("==useForwardTopicAction message", message);
	const router = useRouter();
	// 引用串消息, 跳转话题页
	if (!(message.qlm || message.qmid)) {
		return null;
	}
	const qmid = message.qmid ?? message._id;
	
	return {
		id: 'message-forward-topic',
		icon: 'discussion',
		label: 'Topic',
		type: 'interaction',
		// context: ['pinned', 'message', 'message-mobile', 'threads', 'direct', 'videoconf', 'videoconf-threads'],
		action() {
			// console.log('==room-forward-topic  action');
			const url = router.buildRoutePath({
				name: 'topics-detail',
				params: { id: qmid },
				search: { rid: message.rid, type: 'quote' }
			});
			window.open(url, '_blank');
		},
		order: 5,
		group: 'menu',
	};
};
