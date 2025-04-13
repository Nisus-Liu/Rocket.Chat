import type { UseBoundStore, StoreApi } from 'zustand';

import type { IIdMap } from './IIdMap';

export class IdMapOverStore<T extends { _id: string }, TStore extends UseBoundStore<StoreApi<{ records: T[] }>>>
	implements IIdMap<T['_id'], T>
{
	private internallyMutating = false;

	constructor(
		protected store: TStore,
		onMutate?: () => void,
	) {
		store.subscribe(() => {
			if (this.internallyMutating) {
				this.internallyMutating = false;
				return;
			}
			onMutate?.();
		});
	}

	get(id: T['_id']): T | undefined {
		return this.store.getState().records.find((record) => record._id === id);
	}

	set(id: T['_id'], value: T): void {
		this.internallyMutating = true;
		this.store.setState((state) => {
			const records = [...state.records];
			const index = records.findIndex((r) => r._id === id);
			if (index !== -1) {
				records[index] = { ...value };
			} else {
				records.push(value);
			}
			return { records };
		});
	}

	remove(id: T['_id']): void {
		this.store.setState((state) => ({
			records: state.records.filter((record) => record._id !== id),
		}));
	}

	has(id: T['_id']): boolean {
		return this.store.getState().records.some((record) => record._id === id);
	}

	empty(): boolean {
		return this.size() === 0;
	}

	clear(): void {
		this.store.setState({ records: [] });
	}

	forEach(iterator: (value: T, key: T['_id']) => boolean | void): void {
		for (const record of this.store.getState().records) {
			const breakIfFalse = iterator.call(null, record, record._id);
			if (breakIfFalse === false) {
				return;
			}
		}
	}

	async forEachAsync(iterator: (value: T, key: T['_id']) => Promise<boolean | void>): Promise<void> {
		for (const record of this.store.getState().records) {
			// eslint-disable-next-line no-await-in-loop
			const breakIfFalse = await iterator.call(null, record, record._id);
			if (breakIfFalse === false) {
				return Promise.resolve();
			}
		}
	}

	size(): number {
		return this.store.getState().records.length;
	}
}
