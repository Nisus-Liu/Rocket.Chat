import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'topics-index': {
			pathname: '/topics';
			pattern: '/topics';
		};
		'topics-detail': {
			pathname: `/topics/${string}`;
			pattern: '/topics/:id';
		};
	}
}

export const topicsRoute = createRouteGroup(
	'topics',
	'/topics',
	lazy(() => import('./TopicsRouter')),
);

topicsRoute('', {
	name: 'topics-index',
	component: lazy(() => import('./TopicsPage')),
});
