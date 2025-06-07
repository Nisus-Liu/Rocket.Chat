import { isTranslatedMessage, getUserDisplayName } from '@rocket.chat/core-typings';
import type { ITranslatedMessage, IMessage } from '@rocket.chat/core-typings';

export function createQuoteAttachment(
	message: IMessage | ITranslatedMessage,
	messageLink: string,
	useRealName: boolean,
	userAvatarUrl: string,
) {
	return {
		text: message.msg,
		md: message.md,
		...(isTranslatedMessage(message) && { translations: message?.translations }),
		message_link: messageLink,
		author_name: message.alias || getUserDisplayName(message.u.name, message.u.username, useRealName),
		author_icon: userAvatarUrl,
		attachments: message.attachments || [],
		ts: message.ts,
		// ::引用消息串的作者用户名和姓名, 始终添加, 不让 useRealName 影响 -- 2025.06.07 L&J
		username: message.u.username, 
		name: message.u.name, 
	};
}
