import { Box, Margins, Pagination, Table, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { Page, PageContent, PageHeader } from '../../components/Page';
import { useEndpointData } from '../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../lib/asyncState';

const TopicsPage = () => {
	const t = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(25);

	const {
		value: data,
		phase: state,
		reload,
	} = useEndpointData('/v1/topics.list', {
		params: {
			offset: current,
			count: itemsPerPage,
			sort: { ts: -1 },
		},
	});

	const handleClick = (topicId: string) => {
		// TODO: 实现点击话题跳转到详情页
		console.log('Clicked topic:', topicId);
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
									<TableCell>{t('Replies')}</TableCell>
									<TableCell>{t('Last_Message')}</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{state === AsyncStatePhase.LOADING && (
									<TableRow>
										<TableCell colSpan={4}>{t('Loading')}</TableCell>
									</TableRow>
								)}
								{state === AsyncStatePhase.RESOLVED &&
									data?.topics?.map((topic) => (
										<TableRow key={topic._id} action onClick={() => handleClick(topic._id)}>
											<TableCell>{topic.title}</TableCell>
											<TableCell>{topic.u?.username}</TableCell>
											<TableCell>{topic.replies}</TableCell>
											<TableCell>{new Date(topic.ts).toLocaleString()}</TableCell>
										</TableRow>
									))}
							</TableBody>
						</Table>
						{state === AsyncStatePhase.RESOLVED && (
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
