import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import { Suspense, useEffect } from 'react';

import PageSkeleton from '../../components/PageSkeleton';

type TopicsRouterProps = {
	children?: ReactNode;
};

const TopicsRouter = ({ children }: TopicsRouterProps): ReactElement => {
	const router = useRouter();

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				console.log('==router', router);
				// if (router.getRouteName() !== 'topics-index') {
				// 	return;
				// }
				//
				// router.navigate({ name: 'omnichannel-current-chats' }, { replace: true });
			}),
		[router],
	);

	if (!children) {
		return <PageSkeleton />;
	}

	return (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
		</>
	);
};

export default TopicsRouter;
