import { DbAdapter } from "./db-adapter";
export interface IMigrationResolver {
    resolve(name: string): Migration;
}
export interface MigrationConfig {
    depends: string[];
    requires: string[];
}
export declare class Migration {
    args: {
        cwd: string;
        resolver: IMigrationResolver;
        dbAdapter: DbAdapter;
    };
    name: string;
    cfg: MigrationConfig;
    constructor(args: {
        cwd: string;
        resolver: IMigrationResolver;
        dbAdapter: DbAdapter;
    });
    get dbAdapter(): DbAdapter;
    get cwd(): string;
    getConfig(): Promise<MigrationConfig>;
    requires(): Promise<string[]>;
    getParents(): Promise<Migration[]>;
    isApplied(): Promise<boolean>;
    getSQLFiles(op: string): Promise<string[]>;
    deployed: boolean;
    deploy(): Promise<void>;
    verified: boolean;
    verify(): Promise<void>;
    reverted: boolean;
    revert(): Promise<void>;
}
//# sourceMappingURL=migration.d.ts.map