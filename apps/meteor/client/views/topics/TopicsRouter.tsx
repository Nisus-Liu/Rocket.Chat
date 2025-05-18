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
				console.log('==router', router.getRouteName());
				if (router.getRouteName() !== 'topics-index') {
					return;
				}
				router.navigate({ name: 'topics-home' }, { replace: true });
			}),
		[router],
	);

	if (!children) {
		// console.log('==children none')
		return <PageSkeleton />;
	}

	return (
		<>
			<Suspense fallback={<PageSkeleton />}>{children}</Suspense>
		</>
	);
};

export default TopicsRouter;
