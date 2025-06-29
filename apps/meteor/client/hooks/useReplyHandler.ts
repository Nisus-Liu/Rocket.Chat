import { useChat } from '../views/room/contexts/ChatContext';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import type { IMessage } from '@rocket.chat/core-typings';
import { useCallback } from 'react';

interface ReplyParams {
	topic: any;
	replyType: string;
	replyContent: string;
	topicLevel?: string;
}

/**
 * 回复类型: 评论 or 回复
 * 消息类型: 引用串\讨论串\讨论
 * 回复的消息类型 + 回复类型
 */
export const useReplyHandler = () => {
	const chat = useChat();
    // console.log('==useReplyHandler chat', chat);
	const dispatchToastMessage = useToastMessageDispatch();

	const handleReply = useCallback(async ({ topic, replyType, replyContent, topicLevel }: ReplyParams) => {
		if (!chat?.data?.composeMessage) {
			dispatchToastMessage({ type: 'error', message: '发送消息功能不可用' });
			return false;
		}

		// 假定, topic 自身的回复, 只是引用串. 事实也就是哪些引用串无处安放, 把他们当做topic的补充信息
		// 1. topic 的回复, 则当引用处理
		// 2. 纯引用串, 评论或回复, 当引用处理
		let usingQuote = topicLevel === 'topic' && replyType === 'reply';
		// 纯引用
		usingQuote = usingQuote || (!topic.tlm && !topic.tmid && (topic.qmid || topic.qlm));
		// 讨论串中消息 & 是引用串
		usingQuote = usingQuote || (topic.tmid && topic.tmid !== topic._id && (topic.qmid || topic.qlm))

		try {
			let message: IMessage;
			let composedMessage = undefined;
			
			if (usingQuote) {
				composedMessage = await chat.data.composeMessage(replyContent, {
					sendToChannel: true,
					quotedMessages: [{ ...topic }],
					originalMessage: null,
				});
				console.log('==useReplyHandler usingQuote composedMessage', composedMessage);
			}

			message = {
				rid: topic.rid,
				msg: replyContent, // 放前面, 避免覆盖掉引用的特殊格式msg
				...composedMessage,
			} as IMessage;
			
			// 考虑有些消息既是讨论串又是引用串, 所以需要同时带上tmid和qmid
			if (topic.tlm || topic.tmid) {
				// 回复讨论串消息
				message.tmid = topic.tmid || topic._id;
			}
			// 被回复者是引用串, 且, 当前消息要当做引用串, 才赋值 qmid
			if (composedMessage && (topic.qlm || topic.qmid)) {
				// 回复引用消息
				message.qmid = topic.qmid || topic._id;
			}
			// if (!message.tmid && !message.qmid) {
			// 	dispatchToastMessage({ type: 'error', message: '暂仅支持回复讨论串和引用串的消息' });
			// 	return false;
			// }

			await sdk.call('sendMessage', message);

			dispatchToastMessage({ type: 'success', message: replyType === 'reply' ? '回复成功' : '评论成功' });
			return true;
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error.message });
			return false;
		}
	}, [chat, dispatchToastMessage]);

	return { handleReply };
}; 