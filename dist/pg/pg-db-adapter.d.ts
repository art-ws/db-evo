import { ClientConfig, Pool } from "pg";
import { DbAdapter, IDbPatchEntry } from "../core/db-adapter";
export interface PgDbConnection {
    dbname: string;
    host: string;
    port: number;
    username: string;
    password: string;
}
export declare class PgDbAdapter extends DbAdapter {
    args: {
        connection: PgDbConnection;
    };
    cfg: ClientConfig;
    schema: string;
    table: string;
    pool: Pool;
    constructor(args: {
        connection: PgDbConnection;
    });
    private getClientConfig;
    getPool(): Promise<Pool>;
    get fullTableName(): string;
    execSQL<T>(sql: string): Promise<T[]>;
    checkConnection(): Promise<void>;
    createDb(): Promise<void>;
    ensureDatabase(): Promise<void>;
    isTableExists({ schema, table }: {
        schema: any;
        table: any;
    }): Promise<boolean>;
    createSystemTable(): Promise<void>;
    ensureSystemTable(): Promise<void>;
    initialize(): Promise<void>;
    hasPatch(ver: string): Promise<boolean>;
    registerPatch({ ver, note, checksum, }: {
        ver: string;
        note?: string;
        checksum?: string;
    }): Promise<void>;
    unregisterPatch(ver: string): Promise<void>;
    execFiles(args: {
        ver?: string;
        register?: boolean;
        unregister?: boolean;
        note?: string;
        files: string[];
    }): Promise<void>;
    list(): Promise<IDbPatchEntry[]>;
}
//# sourceMappingURL=pg-db-adapter.d.ts.map