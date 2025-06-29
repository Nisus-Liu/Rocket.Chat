import { Box, Button, Margins, TextAreaInput, Avatar, Divider, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation, useRouter, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { Page, PageContent, PageHeader } from '../../components/Page';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useChat } from '../room/contexts/ChatContext';
import ChatProvider from '../room/providers/ChatProvider';
import type { IMessage, PageMoreData, Comment, TopicDetail, TopicType } from '@rocket.chat/core-typings';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import MessageContentBody from '../../components/message/MessageContentBody';
import AttachmentAuthorName from '../../components/message/content/attachments/structure/AttachmentAuthorName';
import AttachmentAuthor from '../../components/message/content/attachments/structure/AttachmentAuthor';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import AttachmentAuthorAvatar from '../../components/message/content/attachments/structure/AttachmentAuthorAvatar';
import { useUserInfoQuery } from '/client/hooks/useUserInfoQuery';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { dispatchToastMessage } from '/client/lib/toast';
import { RoomProvider } from '../room';
import { useGetMessageByID } from '../room/contextualBar/Threads/hooks/useGetMessageByID';
import { useForceUpdate } from '/client/hooks/useForceUpdate';
import { useReplyHandler } from '/client/hooks/useReplyHandler';
import type { Keys as IconName } from '@rocket.chat/icons';

const COMMENTS_PER_PAGE = 2;


const MyIconButton = ({
	text,
	preIcon,
	postIcon,
	onClick,
	children,
	small,
	color = "hint",
	...props
}: {
	text?: string,
	preIcon?: IconName,
	postIcon?: IconName,
	onClick?: () => void,
	children?: React.ReactNode,
	small?: boolean,
	color?: string,
	[key: string]: any
}) => {
	return <>
		<Box
			fontScale={small ? "c1" : "c1"}
			color="hint"
			style={{ cursor: 'pointer' }}
			onClick={onClick}
			{...props}
		>
			{preIcon && <Icon name={preIcon} size="x16" marginInlineStart="x4" />}
			{text || children}
			{postIcon && <Icon name={postIcon} size="x16" marginInlineStart="x4" />}
		</Box>
	</>
}

/**
 * 评论消息box
 */
const CommentMsgBox = ({ comment }: { comment: Comment }) => {
	// 被回复者用户显示名  修改后引用消息会冗余 username 和 name, 降级使用 author_name (源代码)
	const firstAttachment = comment.attachments?.[0];
	const repliedUserDisplayName = firstAttachment && useUserDisplayName({ name: firstAttachment.name, username: firstAttachment.username || firstAttachment.author_name });
	const [replyInputing, setReplyInputing] = useState(false);
	const [replyText, setReplyText] = useState('');
	const { handleReply } = useReplyHandler();

	const handleSubmitReply = async () => {
		// if (!chat?.data?.composeMessage) {
		// 	dispatchToastMessage({ type: 'error', message: '发送消息功能不可用' });
		// 	return;
		// }

		// try {
		// 	let message: IMessage;
		// 	let composedMessage = undefined;
		// 	if ((comment.tmid && comment.tmid !== comment._id)
		// 		|| (!comment.tlm && (comment.qlm || comment.qmid))) {
		// 		// 讨论串非头消息 或 引用消息(头或非头, 但不是讨论串头)  都需要处理被引用消息
		// 		composedMessage = await chat.data.composeMessage(replyText, {
		// 			sendToChannel: true,
		// 			quotedMessages: [{ ...comment }],
		// 			originalMessage: null,
		// 		});
		// 	}
		// 	message = {
		// 		rid: comment.rid,
		// 		msg: replyText, // 放前面, 避免覆盖掉引用的特殊格式msg
		// 		...composedMessage,
		// 	} as IMessage;
		// 	// 考虑有些消息既是讨论串又是引用串, 所以需要同时带上tmid和qmid
		// 	if (comment.tlm || comment.tmid) {
		// 		// 回复讨论串消息
		// 		message.tmid = comment.tmid || comment._id;
		// 	}
		// 	if (comment.qlm || comment.qmid) {
		// 		// 回复引用消息
		// 		message.qmid = comment.qmid || comment._id;
		// 	}
		// 	if (!message.tmid && !message.qmid) {
		// 		dispatchToastMessage({ type: 'error', message: '暂仅支持回复讨论串和引用串的消息' });
		// 		return;
		// 	}

		// 	await sdk.call('sendMessage', message);

		// 	setReplyInputing(false);
		// 	setReplyText('');
		// 	dispatchToastMessage({ type: 'success', message: '回复成功' });
		// } catch (error: any) {
		// 	dispatchToastMessage({ type: 'error', message: error.message });
		// }

		const r = await handleReply({
			topic: comment,
			replyType: 'reply',
			replyContent: replyText,
		})
		if (r) {
			setReplyText('');
			setReplyInputing(false);
		}
	};

	const toggleReplyInputingState = () => {
		setReplyInputing(!replyInputing)
		if (!replyInputing) {
			// 取消回复后, 清除回复内容
			setReplyText('')
		}
	}

	return (
		<Box display="flex" flexDirection="column" marginBlock="x8">
			{	/* 回复某人 */
				comment.attachments?.length ? (
					<Box display='flex' alignItems='center'>
						<Box display="flex" alignItems="center" marginBlock="x4">
							<Avatar size="x24" url={`/avatar/${comment.u.name}`} />
							<Box fontScale="p2" marginInlineStart="x8">{comment.u.name}</Box>
						</Box>
						<Box marginInline="x4">
							<Icon name="chevron-left" size="x16" color="hint" />
						</Box>
						<Box display="flex" alignItems="center" marginBlock="x4">
							<Avatar size="x24" url={`/avatar/${repliedUserDisplayName}`} />
							<Box fontScale="p2" marginInlineStart="x8">{repliedUserDisplayName}</Box>
						</Box>
					</Box>
				) :
					/* 无回复某人 */
					<Box display="flex" alignItems="center" marginBlock="x4">
						<Avatar size="x24" url={`/avatar/${comment.u.name}`} />
						<Box fontScale="p2" marginInlineStart="x8">{comment.u.name}</Box>
					</Box>
			}
			<Box marginBlock="x4">
				{comment.md ? <MessageContentBody md={comment.md} /> : comment.msg}
			</Box>
			<Box display="flex" alignItems="center" marginBlock="x4">
				<Box fontScale="c1" color="hint" display="flex" alignItems="center">
					{new Date(comment.ts).toLocaleString()}
					<Box marginInline="x8" color="hint">·</Box>
					<MyIconButton text={replyInputing ? '取消' : '回复'} onClick={toggleReplyInputingState} />
				</Box>
			</Box>
			{replyInputing && (
				<Box display="flex" flexDirection="column" marginBlock="x4">
					<TextAreaInput
						value={replyText}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.currentTarget.value)}
						placeholder={'撰写回复'}
						rows={3}
					/>
					<Box display="flex" justifyContent="flex-end">
						<Button primary onClick={handleSubmitReply}>
							{'发送'}
						</Button>
					</Box>
				</Box>
			)}
		</Box>
	);
};

const TopicDetailPageInner: React.FC<{ topicId: string, rid: string, topicType: TopicType }> = ({ topicId, rid, topicType }) => {
	const t = useTranslation();
	const router = useRouter();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const formatTime = useTimeAgo();

	const [newComment, setNewComment] = useState('');
	const [lastUpdate, setLastUpdate] = useState<number>(0);
	const [currPageOffset1, setCurrPageOffset1] = useState<number | null>(null);
	const [currPageOffset2, setCurrPageOffset2] = useState<number | null>(null);
	const [direction, setDirection] = useState<'first' | 'prev' | 'next'>('first');
	const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
	const [expandedReplies, setExpandedReplies] = useState<{
		commentId: string;
		replies: Comment[];
		offset?: number;
		hasMore: boolean;
	} | null>(null);
	const [replyingTo, setReplyingTo] = useState<{
		commentId: string;
		username: string;
	} | null>(null);
	const [replyText, setReplyText] = useState('');
	const [localTopic, setLocalTopic] = useState<TopicDetail>({} as TopicDetail);
	const limit = COMMENTS_PER_PAGE;
	const forceUpdate = useForceUpdate();

	// 使用自定义Hook处理回复
	const { handleReply } = useReplyHandler();

	// 获取话题详情的接口
	const getTopicDetail = useEndpoint('GET', '/v1/topics.discussion.detail');

	// 获取话题详情
	const queryKey = ['topic', topicId, rid, currPageOffset1, currPageOffset2, direction, limit, lastUpdate];
	const { data: topic, isLoading, refetch, error } = useQuery({
		queryKey,
		queryFn: async () => {
			if (!rid) {
				throw new Error('Room ID is required');
			}
			const result = await getTopicDetail({
				topicId,
				rid,
				offset1: currPageOffset1 || undefined,
				offset2: currPageOffset2 || undefined,
				direction,
				limit: limit,
				type: topicType,
			});
			return result;
		},
		enabled: !!topicId && !!rid,
		meta: {
			apiErrorToastMessage: true, // 使用Rocket.Chat内置的错误处理
		},
	});

	useEffect(() => {
		setLocalTopic(topic);
	}, [topic]);

	// 发表评论的mutation
	const { mutate: submitComment } = useMutation({
		mutationFn: async (text: string) => {
			// const message = {
			// 	rid: rid,
			// 	msg: text,
			// 	tmid: localTopic.tmid,
			// 	qmid: localTopic.qmid,
			// } as IMessage
			// // 使用 sdk.call('sendMessage') 发送消息
			// await sdk.call('sendMessage', message);

			handleReply({
				topic: {
					rid: rid,
					tlm: localTopic.tlm,
					tmid: localTopic.tmid,
					qlm: localTopic.qlm,
					qmid: localTopic.qmid,
				},
				topicLevel: 'topic',
				replyType: 'comment',
				replyContent: text,
			})
		},
		onSuccess: () => {
			setNewComment('');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error.message });
		},
	});

	// 获取讨论消息的接口
	const getReplies = useEndpoint('GET', '/v1/topics.discussion.replies');

	// 处理导航
	const handleFirstPage = () => {
		setDirection('first');
		setCurrPageOffset1(null);
		setCurrPageOffset2(null);
		setLastUpdate(Date.now());
	};

	const handleChangePage = (direction: 'prev' | 'next') => {
		if (!localTopic?.comments?.length) return;
		const firstOne = localTopic.comments[0];
		const lastOne = localTopic.comments[localTopic.comments.length - 1];
		setCurrPageOffset1(new Date(firstOne.ts).getTime());
		setCurrPageOffset2(new Date(lastOne.ts).getTime());
		setDirection(direction);
		setLastUpdate(Date.now());
		setExpandedReplies(null);
	}

	const handlePrevPage = () => {
		handleChangePage('prev');
	};

	const handleNextPage = () => {
		handleChangePage('next');
	};

	// 处理刷新
	const handleRefresh = async () => {
		setLastUpdate(Date.now());
	};

	// 处理发表评论
	const handleSubmitComment = () => {
		if (!newComment.trim()) {
			dispatchToastMessage({ type: 'error', message: '请输入评论' });
			return;
		}
		submitComment(newComment);
	};

	// 处理回复按钮点击
	const handleReplyClick = (comment: Comment) => {
		setReplyingTo({
			commentId: comment._id,
			username: comment.u.name,
		});
	};

	// 处理取消回复
	const handleCancelReply = () => {
		setReplyingTo(null);
		setReplyText('');
	};

	// 处理展开回复
	const handleExpandReplies = async (comment: any) => {
		const { _id: commentId, tlm, qlm, type } = comment;
		const result = await getReplies({
			commentId: type == 'discussion' ? comment.lmid : commentId,
			tlm,
			qlm,
			type,
		});
		// const newReplies = result.replies || [];
		// console.log('==handleExpandReplies newReplies', newReplies);
		// setExpandedReplies({
		// 	commentId,
		// 	replies: newReplies,
		// 	offset: newReplies.length > 0 ? new Date(newReplies[newReplies.length - 1].ts).getTime() : undefined,
		// 	hasMore: newReplies.length === 5,
		// });
	};

	// 处理加载更多回复 - 使用响应式缓存更新
	const handleLoadMoreReplies = async (comment: any, type: 'topic' | 'comment') => {
		if (!comment.reply) {
			comment.reply = {
				list: [],
				hasMore: false,
				show: false,
				offset: 0,
			};
		}

		const { tlm, qlm } = comment;
		const commentId = type == 'topic' ? comment.qmid : comment._id;

		const result = await getReplies({
			commentId,
			offset: comment.reply?.offset,
			tlm,
			qlm,
			type,
		});

		comment.reply = {
			...comment.reply,
			...result,
			list: [...comment.reply.list, ...result.list],
			show: true,
		}
		forceUpdate();
		// setTimeout(() => {
		// 	console.log("==handleLoadMoreReplies", localTopic, topic)
		// })
	};

	// 处理收起回复 - 使用响应式缓存更新
	const handleCollapseReplies = (comment: any) => {
		comment.reply = {
			list: [],
			hasMore: false,
			show: false,
			offset: 0,
		};
		forceUpdate();
	};

	if (isLoading) {
		return (
			<Page>
				<PageHeader title={t('Loading')} />
				<PageContent>
					<Box display='flex' justifyContent='center' alignItems='center' height='100%'>
						{t('Loading')}...
					</Box>
				</PageContent>
			</Page>
		);
	}

	return <Page>
		<PageHeader
			title={localTopic?.title}
			{...(!document.referrer ? {} : { onClickBack: () => router.navigate(-1) })}
		>
			<MyIconButton data-qa='current-chats-options-clearFilters' onClick={handleRefresh}>
				<Icon name='refresh' size='x16' marginInlineEnd={4} />
				{t('Refresh')}
			</MyIconButton>
		</PageHeader>
		<PageContent>
			<Box
				display="flex"
				flexDirection="column"
				height="calc(100vh - 64px)"
				overflowY="auto"
			>
				<Margins block="x16">
					{/* 话题基本信息 */}
					<Box display="flex" flexDirection="column" marginBlock="x8">
						<Box display="flex" alignItems="center" marginBlock="x8">
							<Avatar size="x40" url={`/avatar/${localTopic?.u?.name}`} />
							<Box>
								<Box fontScale="h4">{localTopic?.u?.name}</Box>
								<Box fontScale="c1" color="hint">
									{new Date(localTopic?.ts).toLocaleString()}
								</Box>
							</Box>
						</Box>
						{localTopic?.hasReply && ((localTopic.reply?.show) ? (
							<>
								<MyIconButton preIcon="chevron-up" onClick={() => handleCollapseReplies(localTopic)}>
									{'收起回复'}
								</MyIconButton >
								<Box mi="x32" display="flex" flexDirection="column" marginBlock="x8">
									{localTopic.reply?.list?.map((reply: Comment) => (
										<CommentMsgBox key={reply._id} comment={reply} />
									))}
									{localTopic.reply?.hasMore && (
										<MyIconButton small preIcon="chevron-down" onClick={() => handleLoadMoreReplies(localTopic, 'topic')}>
											{'加载更多'}
										</MyIconButton>
									)}
								</Box>
							</>
						) : (
							<MyIconButton small preIcon="thread" onClick={() => handleLoadMoreReplies(localTopic, 'topic')}>
								{'展开回复'}
							</MyIconButton>
						))}
					</Box>

					<Divider />

					{/* 评论列表 */}
					<Box display="flex" flexDirection="column" marginBlock="x16">
						<Box fontScale="h4">{'评论'}</Box>
						{localTopic?.comments?.map((comment: Comment) => (
							<Box key={comment._id} display="flex" flexDirection="column" marginBlock="x8">
								<CommentMsgBox comment={comment} />
								{/* tlm 非空, 则说明这是个讨论串的头消息, 显示"展开回复", 点击加载 */
									(comment.tlm || comment.qlm) && (
										<Box>
											{comment.reply?.show ? (
												<>
													<MyIconButton small preIcon="chevron-up" onClick={() => handleCollapseReplies(comment)}>
														{'收起回复'}
													</MyIconButton>
													<Box mi="x32" display="flex" flexDirection="column" marginBlock="x8">
														{comment.reply?.list?.map((reply: Comment) => (
															<CommentMsgBox key={reply._id} comment={reply} />
														))}
														{comment.reply?.hasMore && (
															<MyIconButton small preIcon="chevron-down" onClick={() => handleLoadMoreReplies(comment, 'comment')}>
																{'加载更多'}
															</MyIconButton>
														)}
													</Box>
												</>
											) : (
												<MyIconButton small preIcon="thread" onClick={() => handleLoadMoreReplies(comment, 'comment')}>
													{'展开回复'}
												</MyIconButton>
											)}
										</Box>
									)}
							</Box>
						))}
					</Box>

					{/* 发表评论区域 */}
					<Box display="flex" flexDirection="column" marginBlock="x8">
						<TextAreaInput
							value={newComment}
							onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.currentTarget.value)}
							placeholder={'撰写评论'}
							rows={3}
						/>
						<Box display="flex" justifyContent="flex-end">
							<Button primary onClick={handleSubmitComment}>
								{'发表评论'}
							</Button>
						</Box>
					</Box>

					{/* 分页 */}
					<Box display="flex" marginBlock="x8">
						<Button onClick={handleFirstPage}>
							首页
						</Button>
						<Button onClick={handlePrevPage}>
							前页
						</Button>
						<Button onClick={handleNextPage}>
							后页
						</Button>
					</Box>
				</Margins>
			</Box>
		</PageContent>
	</Page>
};

const TopicDetailPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const topicId = useRouteParameter('id') as string;
	let rid = useSearchParameter('rid');
	const type = useSearchParameter('type') as TopicType;
	// 使用 useGetMessageByID hook 获取消息
	const getMessageByID = useGetMessageByID();
	const { data: messageData } = useQuery({
		queryKey: ['message', topicId],
		queryFn: () => getMessageByID(topicId || ''),
		enabled: !!topicId && !rid,
	});

	// 从 messageData 获取 rid
	if (messageData?.rid) {
		rid = messageData.rid;
	}

	if (!topicId) {
		router.navigate({
			name: 'topics-index',
		});
		return null;
	}


	if (!rid) {
		return null;
	}

	return (
		<RoomProvider rid={rid}>
			<ChatProvider>
				<TopicDetailPageInner {...{ topicId, rid, topicType: type }} />
			</ChatProvider>
		</RoomProvider>
	);
};

export default TopicDetailPage; 