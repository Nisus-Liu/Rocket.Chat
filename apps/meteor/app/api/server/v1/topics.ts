import { Messages, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/topics.list': {
			GET: (params: { offset?: number; count?: number; sort?: string }) => {
				topics: any[];
				total: number;
				count: number;
				offset: number;
			};
		};
		'/v1/topics.get': {
			GET: (params: { topicId: string }) => {
				topic: any;
			};
		};
	}
}

API.v1.addRoute(
	'topics.list',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = this.parseJsonQuery();

			const user = Meteor.user();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const userSubscriptions = await Subscriptions.findByUserId(user._id, { projection: { rid: 1 } }).toArray();
			const roomIds = userSubscriptions.map((sub) => sub.rid);

			// 获取用户有权限查看的讨论串
			const topics = await Messages.find(
				{
					t: 'discussion-created',
					$or: [{ rid: { $in: roomIds } }, { prid: { $in: roomIds } }],
				},
				{
					sort: sort || { ts: -1 },
					skip: offset,
					limit: count,
					projection: {
						_id: 1,
						rid: 1,
						prid: 1,
						msg: 1,
						ts: 1,
						u: 1,
						replies: 1,
					},
				},
			).toArray();

			const total = await Messages.find({
				t: 'discussion-created',
				$or: [{ rid: { $in: roomIds } }, { prid: { $in: roomIds } }],
			}).count();

			return API.v1.success({
				topics,
				total,
				count: topics.length,
				offset,
			});
		},
	},
);

API.v1.addRoute(
	'topics.get',
	{ authRequired: true },
	{
		async get() {
			const { topicId } = this.urlParams;

			check(topicId, String);

			const user = Meteor.user();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const userSubscriptions = await Subscriptions.findByUserId(user._id, { projection: { rid: 1 } }).toArray();
			const roomIds = userSubscriptions.map((sub) => sub.rid);

			const topic = await Messages.findOne({
				_id: topicId,
				t: 'discussion-created',
				$or: [{ rid: { $in: roomIds } }, { prid: { $in: roomIds } }],
			});

			if (!topic) {
				throw new Meteor.Error('error-invalid-topic', 'Invalid topic');
			}

			return API.v1.success({
				topic,
			});
		},
	},
);
