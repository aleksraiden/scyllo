import { Client, DseClientOptions, types } from 'cassandra-driver';
import { selectFromRaw, ValidDataType } from './QueryBuilder';

export type DatabaseObject = {[key: string]: ValidDataType};
export type Tables = {[key: string]: DatabaseObject};

export type ScylloClientOptions = {
    client: DseClientOptions,
}

export class ScylloClient<TableMap extends Tables> {

    keyspace: string = 'scyllo';
    client: Client;

    constructor(options: ScylloClientOptions) {
        this.client = new Client(options.client);
        this.keyspace = options.client.keyspace ?? '';
    }

    async raw(cmd: string): Promise<types.ResultSet> {
        return await this.client.execute(cmd);
    }
    async rawWithParams(query: string, args: any[]): Promise<types.ResultSet> {
        return await this.client.execute(query, args);
    }

    async useKeyspace(keyspace: string) {
        this.keyspace = keyspace;
        return await this.raw(`USE ${keyspace};`);
    }

    async selectFrom<F extends keyof TableMap>(table: F, select: '*' | (keyof TableMap[F])[], criteria?: { [key in keyof TableMap[F]]?: TableMap[F][key] | string }, extra?: string): Promise<TableMap[F][]> {
        const query = selectFromRaw<TableMap, F>(this.keyspace, table, select, criteria, extra);
        const result = await this.rawWithParams(query.query, query.args);
        return result.rows.map((row) => (Object.assign({}, ...row.keys().map(k => ({ [k]: row.get(k) }))))) as TableMap[F][];    
    }
}