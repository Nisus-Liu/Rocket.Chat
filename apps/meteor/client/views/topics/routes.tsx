import { lazy } from 'react';

import { createRouteGroup } from '../../lib/createRouteGroup';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'topics-index': {
			pathname: '/topics';
			pattern: '/topics';
		};
		'topics-home': {
			pathname: '/topics/home';
			pattern: '/topics/home';
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

topicsRoute('/home', {
	name: 'topics-home',
	component: lazy(() => import('./TopicsPage')),
});

topicsRoute('/:id', {
	name: 'topics-detail',
	component: lazy(() => import('./TopicDetailPage')),
});
