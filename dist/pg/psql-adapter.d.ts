/// <reference types="node" />
import { ClientConfig } from "pg";
import { ExecOptions } from "child_process";
export declare class PSqlAdapter {
    config: ClientConfig;
    constructor(config: ClientConfig);
    getOptions(): string;
    get pwd(): string;
    exec(cmd: string, opts: string, o?: Partial<ExecOptions>): Promise<void>;
    createDb(dbname?: string): Promise<void>;
    execFile(file: string): Promise<void>;
}
//# sourceMappingURL=psql-adapter.d.ts.map