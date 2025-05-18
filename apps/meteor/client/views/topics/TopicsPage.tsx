import { Box, Margins, Pagination, Table, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Page, PageContent, PageHeader } from '../../components/Page';
import { useEndpoint } from '@rocket.chat/ui-contexts';

const TopicsPage = () => {
	const t = useTranslation();
	const router = useRouter();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(25);

	const getDlmList = useEndpoint('GET', '/v1/topics.discussion.list');

	const { data, isLoading } = useQuery({
		queryKey: ['topics', current, itemsPerPage],
		queryFn: async () => {
			const result = await getDlmList({
				offset: current,
				count: itemsPerPage,
				sort:`{ "ts": -1 }`,
			});
			return result;
		},
	});

	const handleClick = (topicId: string, drid: string) => { // p1: 话题消息_id, p2: 话题room id
		router.navigate({
			name: 'topics-detail',
			params: { id: topicId },
			search: { drid },
		});
	};

	return (
		<Page>
			<PageHeader title={t('Topic')} />
			<PageContent>
				<Margins block='x16'>
					<Box display='flex' flexDirection='column' height='100%'>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>{t('Title')}</TableCell>
									<TableCell>{t('Author')}</TableCell>
									<TableCell>参与人</TableCell>
									<TableCell>{t('Last_Message')}</TableCell>
									<TableCell>回复数</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{isLoading && (
									<TableRow>
										<TableCell colSpan={4}>{t('Loading')}</TableCell>
									</TableRow>
								)}
								{!isLoading &&
									data?.topics?.map((topic) => (
										<TableRow key={topic._id} action onClick={() => handleClick(topic._id, topic.drid)}>
											<TableCell>{topic.title}</TableCell>
											<TableCell>{topic.u?.name}</TableCell>
											<TableCell>
												{topic.replies?.length > 0 ? (
													<Box display="flex" flexWrap="wrap" gap="4px">
													{topic.replies.map((reply, index) => (
														<Box
														key={index}
														bg="status-info"
														borderRadius="4px"
														paddingInline="8px"
														fontSize="12px"
														>
														{reply}
														</Box>
													))}
													</Box>
												) : (
													'No replies'
												)}
											</TableCell>
											<TableCell>{new Date(topic.ts).toLocaleString()}</TableCell>
											<TableCell>{topic.dcount}</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
						{!isLoading && (
							<Pagination
								count={data?.total || 0}
								current={current}
								itemsPerPage={itemsPerPage}
								onSetItemsPerPage={setItemsPerPage}
								onSetCurrent={setCurrent}
							/>
						)}
					</Box>
				</Margins>
			</PageContent>
		</Page>
	);
};

export default TopicsPage;
