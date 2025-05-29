import { Messages, Rooms, Subscriptions } from '@rocket.chat/models';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { SortDirection } from 'mongodb';

import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { executeSendMessage } from '../../../lib/server/methods/sendMessage';

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
		'/v1/topics.hot': {
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
		'/v1/topics.discussion.list': {
			GET: (params: { offset?: number; count?: number; sort?: string }) => {
				topics: any[];
				total: number;
				count: number;
				offset: number;
			};
		};
		'/v1/topics.discussion.detail': {
			GET: (params: { 
				topicId: string; 
				drid: string; 
				offset1?: number; 
				offset2?: number; 
				direction?: string; 
				limit?: number 
			}) => {
				topic: {
					rid: string;
					drid: string;
					title: string;
					detail: string;
					ts: Date;
					u: {
						_id: string;
						name: string;
					};
					comments: Array<{
						_id: string;
						msg: string;
						ts: Date;
						u: {
							_id: string;
							name: string;
						};
						replies?: Array<{
							_id: string;
							msg: string;
							ts: Date;
							u: {
								_id: string;
								name: string;
							};
						}>;
						tlm: Date;
					}>;
					total: number;
				};
				lastUpdate: string;
			};
		};
		'/v1/topics.discussion.comment': {
			POST: (params: { topicId: string; message: string; replyTo?: string }) => {
				success: boolean;
				comment: {
					_id: string;
					msg: string;
					ts: Date;
					u: {
						_id: string;
						name: string;
					};
				};
			};
		};
		'/v1/topics.discussion.replies': {
			GET: (params: { 
				commentId: string; 
				offset?: number; 
				limit?: number 
			}) => {
				replies: any[];
			};
		};
	}
}

// Helper function to get user's room IDs
async function getUserRoomIds(userId: string): Promise<string[]> {
	const userSubscriptions = await Subscriptions.findByUserId(userId, { projection: { rid: 1 } }).toArray();
	return userSubscriptions.map((sub) => sub.rid);
}

// Helper function to get topics with pagination and sort
async function getTopics(roomIds: string[], offset: number, count: number, sort: any) {
	const topics = await Messages.find(
		{
			t: 'discussion-created',
			rid: { $in: roomIds }
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
		rid: { $in: roomIds }
	}).count();

	return { topics, total };
}

// discussion leader message list
async function getDlmList(roomIds: string[], offset: number, count: number, sort: any) {
	const topics = await Messages.find(
		{
			t: 'discussion-created',
			rid: { $in: roomIds }
		},
		{
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
			projection: {
				_id: 1,
				rid: 1,
				drid: 1,
				prid: 1,
				title: '$msg',
				ts: 1,
				u: 1,
				replies: { $slice: 5 },
				dcount: 1, // discussion count, tcount 估计是讨论串数目
			},
		},
	).toArray();

	const total = await Messages.find({
		t: 'discussion-created',
		rid: { $in: roomIds }
	}).count();

	return { topics, total };
}


API.v1.addRoute(
	'topics.list',
	{ authRequired: true },
	{
		async get() {
			console.log('==topics.list', this.queryParams);
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = this.parseJsonQuery();

			const user = await Meteor.userAsync();
			console.log('==user', user);
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);
			console.log('==roomIds', roomIds);

			const { topics, total } = await getTopics(roomIds, offset, count, sort);

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
	'topics.hot',
	{ authRequired: true },
	{
		async get() {
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = this.parseJsonQuery();

			const user = await Meteor.userAsync();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);

			// For hot topics, sort by replies count by default
			const hotSort = sort || { replies: -1 };
			const { topics, total } = await getTopics(roomIds, offset, count, hotSort);

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

			const user = await Meteor.userAsync();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);

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

API.v1.addRoute(
	'topics.discussion.list',
	{ authRequired: true },
	{
		async get() {
			console.log('==topics.discussion.list', this.queryParams);
			const { offset, count } = await getPaginationItems(this.queryParams);
			const { sort } = this.parseJsonQuery();

			const user = await Meteor.userAsync();
			console.log('==user', user);
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);
			console.log('==roomIds', roomIds);

			const { topics, total } = await getDlmList(roomIds, offset, count, sort);

			return API.v1.success({
				topics,
				total,
				count: topics.length,
				offset,
			});
		}
	}
)


const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_REPLIES_SIZE = 5;
const TS_VIEW_SORT = { ts: -1 as SortDirection }
const TS_VIEW_SORT_REVERSE = { ts: 1 as SortDirection }

API.v1.addRoute(
	'topics.discussion.detail',
	{ authRequired: true },
	{
		async get() {
			const { 
				topicId, 
				drid, 
				offset1: offset1Str, 
				offset2: offset2Str, 
				direction, 
				limit = DEFAULT_PAGE_SIZE 
			} = this.queryParams;
			
			check(topicId, String);
			check(drid, String);
			if (direction) {
				check(direction, String);
			}

			const offset1 = offset1Str ? new Date(Number(offset1Str)) : undefined;
			const offset2 = offset2Str ? new Date(Number(offset2Str)) : undefined;

			const user = await Meteor.userAsync();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);
			// drid 实际是 roomId, 看是否在 roomIds 中, 不在则无权查看
			if (!roomIds.includes(drid)) {
				throw new Meteor.Error('error-no-permission-to-view-topic', 'No permission to view topic');
			}

			// 讨论形式的话题是room实体, 在 rocketchat_room 表里存有room信息, 得出话题标题(fname字段)和详情(topic字段)
			const topicRoom = await Rooms.findOne({
				_id: drid,
			});

			if (!topicRoom) {
				throw new Meteor.Error('error-invalid-topic', 'Invalid topic');
			}

			
			// 构建查询条件
			const query = {
				rid: drid,
				msg: { $ne: ''},
			} as any;

			const total = await Messages.countDocuments(query);

			// 根据导航方向和时间戳构建查询
			const findOptions = {
				projection: {
					_id: 1,
					msg: 1,
					ts: 1,
					ts_ms: { $toLong: '$ts' }, // 添加毫秒时间戳字段
					u: 1,
					replies: { $slice: 5 },
					tlm: 1,
				},
				limit: Number(limit),
				sort: TS_VIEW_SORT // 默认降序
			};

			// 获取第一页的评论
			const getFirstPage = async () => {
				const firstPageQuery = { ...query };
				delete firstPageQuery.ts;
				return await Messages.find(firstPageQuery, { ...findOptions, sort: TS_VIEW_SORT }).toArray();
			};

			// 获取最后一页的评论
			const getLastPage = async () => {
				const lastPageQuery = { ...query };
				delete lastPageQuery.ts;
				const options = { ...findOptions, sort: TS_VIEW_SORT_REVERSE };
				const comments = await Messages.find(lastPageQuery, options).toArray();
				// console.log('==last comments', lastPageQuery, options, comments);
				return comments.reverse();
			};

			// 根据导航方向设置查询条件
			let comments: any[] = [];
			if (direction === 'first') {
				// 首页：获取最新的评论
				comments = await getFirstPage();
			} else if (direction === 'prev') { // 上一页
				// 正常排序取反(这里即升序), 取大于 offset1 的前limit条
				findOptions.sort = TS_VIEW_SORT_REVERSE;
				if (offset1) {
					query.ts = { $gt: offset1 };
				}
				comments = await Messages.find(query, findOptions).toArray();
				// 上一页时要翻转结果
				comments.reverse();
				// console.log('==prev comments', query, findOptions, comments);
			} else if (direction === 'next') { // 下一页
				if (offset2) {
					query.ts = { $lt: offset2 };
				}
				comments = await Messages.find(query, findOptions).toArray();
				// console.log('==next comments', query, findOptions, comments);
			}

			// 两头空后的补偿查询
			// 上一页或下一页, 如果是空, 说明没有到头了, 上一页到头返回第一页, 下一页到头返回最后一页
			if (comments.length === 0) {
				if (direction === 'prev') {
					// 上一页到头，返回第一页
					comments = await getFirstPage();
					// console.log('==prev comments2', comments);
				} else if (direction === 'next') {
					// 下一页到头，返回最后一页  问题: 最后一页不够limit, 直接getLastPage会返回limit个, 造成混乱, 诉求: 刚才看到几条, 补偿返回几条
					// comments = await getLastPage();
					query.ts = { $lte: offset1, $gte: offset2 };
					findOptions.sort = TS_VIEW_SORT;
					comments = await Messages.find(query, findOptions).toArray();
					// console.log('==next comments2', comments);
				}
			}

			return API.v1.success({
				topic: {
					// _id: topicRoom._id,
					rid: topicRoom._id,
					drid: drid,
					title: topicRoom.fname,
					detail: topicRoom.topic,
					ts: topicRoom.ts,
					ts_ms: topicRoom.ts?.getTime(), // 为话题添加毫秒时间戳
					u: {
						_id: topicRoom.u._id,
						name: topicRoom.u.name
					},
					comments,
					total: total,
				},
			});
		}
	}
);

API.v1.addRoute(
	'topics.discussion.comment',
	{ authRequired: true },
	{
		async post() {
			const { topicId, message, replyTo } = this.bodyParams;

			check(topicId, String);
			check(message, String);
			if (replyTo) {
				check(replyTo, String);
			}

			const user = await Meteor.userAsync();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);

			// 验证话题是否存在且有权限
			const topic = await Messages.findOne({
				_id: topicId,
				t: 'discussion-created',
				rid: { $in: roomIds }
			});

			if (!topic) {
				throw new Meteor.Error('error-invalid-topic', 'Invalid topic');
			}

			// 使用 executeSendMessage 发送消息
			const result = await executeSendMessage(user._id, {
				rid: topic.drid,
				msg: message,
				...(replyTo && { tmid: replyTo })
			});

			return API.v1.success({
				success: true,
				comment: {
					_id: result._id,
					msg: result.msg,
					ts: result.ts,
					u: result.u
				}
			});
		}
	}
);


API.v1.addRoute(
	'topics.discussion.replies',
	{ authRequired: true },
	{
		async get() {
			const { commentId, offset, limit = DEFAULT_REPLIES_SIZE } = this.queryParams;
			check(commentId, String);

			const user = await Meteor.userAsync();
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			const roomIds = await getUserRoomIds(user._id);

			// 获取讨论消息
			const query = {
				tmid: commentId,
				rid: { $in: roomIds },
			};
			if (offset) {
				query.ts = { $lt: new Date(Number(offset)) };
			}

			const replies = await Messages.find(
				query,
				{
					projection: {
						_id: 1,
						rid: 1,
						tmid: 1,
						drid: 1,
						msg: 1,
						ts: 1,
						u: 1,
						replies: 1,
						u: 1,
					},
					limit: Number(limit),
					sort: TS_VIEW_SORT // 默认降序
				}
			).toArray();

			return API.v1.success({
				replies,
			});
		}
	}
);