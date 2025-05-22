import { Box, Button, Margins, TextAreaInput, Avatar, Divider, Icon } from '@rocket.chat/fuselage';
import { useTranslation, useRouter, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Page, PageContent, PageHeader } from '../../components/Page';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';

interface Comment {
	_id: string;
	msg: string;
	ts: Date;
	u: {
		_id: string;
		name: string;
	};
	replies?: Comment[];
}

interface TopicDetail {
	// _id: string;
	rid: string;
	drid: string;
	title: string;
	detail: string;
	ts: Date;
	u: {
		_id: string;
		name: string;
	};
	comments: Comment[];
	total: number;
}

const COMMENTS_PER_PAGE = 2;

const TopicDetailPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const topicId = useRouteParameter('id');
	const drid = useSearchParameter('drid');
	console.log('==drid', drid);
	if (!topicId || !drid) {
		router.navigate({
			name: 'topics-index',
		});
		return null;
	}
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const [newComment, setNewComment] = useState('');
	const [lastUpdate, setLastUpdate] = useState<number>(0);
	const [currPageOffset1, setCurrPageOffset1] = useState<number | null>(null);
	const [currPageOffset2, setCurrPageOffset2] = useState<number | null>(null);
	const [direction, setDirection] = useState<'first' | 'prev' | 'next'>('first');
	const limit = COMMENTS_PER_PAGE;

	// 获取话题详情的接口
	const getTopicDetail = useEndpoint('GET', '/v1/topics.discussion.detail');
	// 发表评论的接口
	const postComment = useEndpoint('POST', '/v1/topics.discussion.comment');

	// 获取话题详情
	const { data, isLoading, refetch } = useQuery({
		queryKey: ['topic', topicId, currPageOffset1, currPageOffset2, direction, limit, lastUpdate],
		queryFn: async () => {
			const result = await getTopicDetail({
				topicId,
				drid,
				offset1: currPageOffset1 || undefined,
				offset2: currPageOffset2 || undefined,
				direction,
				limit: limit,
			});
			return result;
		},
		enabled: !!topicId,
	});

	// 发表评论的mutation
	const { mutate: submitComment } = useMutation({
		mutationFn: async (message: string) => {
			await postComment({
				topicId,
				message,
			});
		},
		onSuccess: () => {
			setNewComment('');
			queryClient.invalidateQueries({
				queryKey: ['topic', topicId],
			});
			dispatchToastMessage({ type: 'success', message: '评论成功' });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error.message });
		},
	});

	// 处理导航
	const handleFirstPage = () => {
		setDirection('first');
		setCurrPageOffset1(null);
		setCurrPageOffset2(null);
		setLastUpdate(Date.now());
	};

	const handlePrevPage = () => {
		if (!data?.topic?.comments?.length) return;
		const firstOne = data.topic.comments[0];
		const lastOne = data.topic.comments[data.topic.comments.length - 1];
		setCurrPageOffset1(new Date(firstOne.ts).getTime());
		setCurrPageOffset2(new Date(lastOne.ts).getTime());
		setDirection('prev');
		setLastUpdate(Date.now());
	};

	const handleNextPage = () => {
		if (!data?.topic?.comments?.length) return;
		const firstOne = data.topic.comments[0];
		const lastOne = data.topic.comments[data.topic.comments.length - 1];
		setCurrPageOffset1(new Date(firstOne.ts).getTime());
		setCurrPageOffset2(new Date(lastOne.ts).getTime());
		setDirection('next');
		setLastUpdate(Date.now());
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

	const topic = data?.topic as TopicDetail;

	return (
		<Page>
			<PageHeader
				title={topic?.title}
				onClickBack={() => router.navigate({ name: 'topics-index' })}
			>
					<Box data-qa='current-chats-options-clearFilters' onClick={handleRefresh}>
						<Icon name='refresh' size='x16' marginInlineEnd={4} />
						{t('Refresh')}
					</Box>
			</PageHeader>
			<PageContent>
				<Margins block="x16">
					{/* 话题基本信息 */}
					<Box display="flex" flexDirection="column" gap="x8">
						<Box display="flex" alignItems="center" gap="x8">
							<Avatar size="x40" username={topic?.u?.name} />
							<Box>
								<Box fontScale="h4">{topic?.u?.name}</Box>
								<Box fontScale="c1" color="hint">
									{new Date(topic?.ts).toLocaleString()}
								</Box>
							</Box>
						</Box>
					</Box>

					<Divider />

					{/* 评论列表 */}
					<Box display="flex" flexDirection="column" gap="x16">
						<Box fontScale="h4">{'评论'}</Box>
						<Box display="flex" gap="x8">
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
						{topic?.comments?.map((comment) => (
							<Box key={comment._id} display="flex" flexDirection="column" gap="x8">
								<Box display="flex" gap="x8">
									<Avatar size="x24" username={comment.u.name} />
									<Box flexGrow={1}>
										<Box display="flex" justifyContent="space-between">
											<Box fontScale="p2">{comment.u.name}</Box>
											<Box fontScale="c1" color="hint">
												{new Date(comment.ts).toLocaleString()}
											</Box>
										</Box>
										<Box fontScale="p1">{comment.msg}</Box>
									</Box>
								</Box>
								{/* 回复列表 */}
								{comment.replies && comment.replies.length > 0 && (
									<Box marginLeft="x32" display="flex" flexDirection="column" gap="x8">
										{comment.replies.map((reply) => (
											<Box key={reply._id} display="flex" gap="x8">
												<Avatar size="x24" username={reply.u.name} />
												<Box flexGrow={1}>
													<Box display="flex" justifyContent="space-between">
														<Box fontScale="p2">{reply.u.name}</Box>
														<Box fontScale="c1" color="hint">
															{new Date(reply.ts).toLocaleString()}
														</Box>
													</Box>
													<Box fontScale="p1">{reply.msg}</Box>
												</Box>
											</Box>
										))}
									</Box>
								)}
							</Box>
						))}
					</Box>

					{/* 发表评论区域 */}
					<Box display="flex" flexDirection="column" gap="x8">
						<TextAreaInput
							value={newComment}
							onChange={(e) => setNewComment(e.currentTarget.value)}
							placeholder={'撰写评论'}
							rows={3}
						/>
						<Box display="flex" justifyContent="flex-end">
							<Button primary onClick={handleSubmitComment}>
								{'发表评论'}
							</Button>
						</Box>
					</Box>
				</Margins>
			</PageContent>
		</Page>
	);
};

export default TopicDetailPage; 