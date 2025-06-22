
/**
 * 适用于滚动翻页的场景
 */
export interface PageMoreData<T> {
	list: T[];
	hasMore: boolean;
	show: boolean;
	offset?: number;
}

export interface Comment {
	_id: string;
	rid: string;
	msg: string;
	ts: Date | number | string;
	u: {
		_id: string;
		name: string;
	};
	hasReply?: boolean;
	reply?: PageMoreData<Comment>;
	tlm?: string;
	qlm?: string;
	tmid?: string;
	qmid?: string;
	md?: any[];
	attachments?: any[];
	type?: string;
}

export interface TopicDetail {
	rid: string;
	drid?: string;
	title: string;
	detail: string;
	ts: Date;
	u: {
		_id: string;
		name: string;
	};
	comments: Comment[];
	total: number;
	hasReply?: boolean;
	reply?: PageMoreData<Comment>;
	qmid?: string;
} 