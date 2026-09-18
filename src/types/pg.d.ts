declare module 'pg' {
  import { EventEmitter } from 'events';

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<any>;
    query(queryTextOrConfig: string | any, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }

  export class Client extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<void>;
    query(queryTextOrConfig: string | any, values?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
