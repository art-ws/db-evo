import { PgDbConnection } from "./pg/pg-db-adapter";
export interface Argv extends PgDbConnection {
    _: CommandName[];
    cwd: string;
    env: string;
    engine: string;
    p: string;
    patch: string;
}
export interface Config {
    pg: {
        [env: string]: PgDbConnection;
    };
    patch: string;
    env: string;
    engine: EngineType;
}
export declare type CommandHandler<O> = (o?: O) => Promise<any>;
export interface CommandsController {
    deploy: CommandHandler<unknown>;
    revert: CommandHandler<unknown>;
    verify: CommandHandler<unknown>;
    status: CommandHandler<unknown>;
    list: CommandHandler<unknown>;
}
declare type CommandName = keyof CommandsController;
declare type EngineType = "pg";
export declare function getCommandHandler(cmd: CommandName, argv: Argv, config: Config): CommandHandler<unknown>;
export {};
//# sourceMappingURL=commands.d.ts.map