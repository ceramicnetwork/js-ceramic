import { DataSource } from 'typeorm'
import { StreamID } from 'streamid/lib/stream-id.js';
import type { BaseQuery, DatabaseIndexAPI, IndexStreamArgs, Page, Pagination } from '../types.js'

export class PostgresIndexApi implements DatabaseIndexAPI {
    constructor(
        private readonly dataSource: DataSource,
        private readonly modelsToIndex: Array<StreamID>
      ) {}

    indexStream(args: IndexStreamArgs): Promise<void> {
        throw new Error('Method not implemented.');
    }
    page(query: BaseQuery & Pagination): Promise<Page<StreamID>> {
        throw new Error('Method not implemented.');
    }
    init(): Promise<void> {
        throw new Error('Method not implemented.');
    }

}
