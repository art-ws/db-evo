import { Migration } from "./migration";
import { DbAdapter } from "./db-adapter";
export declare class MigrationResolver {
    args: {
        cwd: string;
        dbAdapter: DbAdapter;
    };
    private cache;
    constructor(args: {
        cwd: string;
        dbAdapter: DbAdapter;
    });
    private doResolve;
    resolve(name: string): Migration;
}
//# sourceMappingURL=migration-resolver.d.ts.map