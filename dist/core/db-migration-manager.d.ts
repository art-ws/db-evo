import { DbAdapter } from "./db-adapter";
export interface DbMigrationManagerArgs {
    cwd: string;
    patch: string;
    dbAdapter: DbAdapter;
}
export declare class DbMigrationManager {
    private args;
    constructor(args: DbMigrationManagerArgs);
    get cwd(): string;
    get dbAdapter(): DbAdapter;
    resolvePatchName(): Promise<string>;
    getPatchName(): Promise<string>;
    deploy(): Promise<void>;
    verify(): Promise<void>;
    revert(): Promise<void>;
    private doOperation;
    status(): Promise<void>;
    list(): Promise<void>;
}
//# sourceMappingURL=db-migration-manager.d.ts.map