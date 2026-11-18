declare module 'pg' {
  import { EventEmitter } from 'events';

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryConfig<I = unknown[]> {
    name?: string;
    text: string;
    values?: I;
    rowMode?: string;
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
  }

  export interface PoolClient extends EventEmitter {
    query<R extends QueryResultRow = QueryResultRow, I = unknown[]>(
      queryTextOrConfig: string | QueryConfig<I>,
      values?: I
    ): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R extends QueryResultRow = QueryResultRow, I = unknown[]>(
      queryTextOrConfig: string | QueryConfig<I>,
      values?: I
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }

  export class Client extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    query<R extends QueryResultRow = QueryResultRow, I = unknown[]>(
      queryTextOrConfig: string | QueryConfig<I>,
      values?: I
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
