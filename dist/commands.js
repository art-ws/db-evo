"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandHandler = void 0;
const db_migration_manager_1 = require("./core/db-migration-manager");
const pg_db_adapter_1 = require("./pg/pg-db-adapter");
function getDbAdapter(argv, cfg) {
    const engine = (argv.engine ?? cfg.engine ?? "pg");
    const env = argv.env ?? cfg.env ?? "default";
    const connection = cfg[engine][env];
    const props = [
        "dbname",
        "host",
        "password",
        "port",
        "username",
    ];
    props.forEach((prop) => {
        connection[prop] = (argv[prop] ?? connection[prop]);
    });
    const dbAdapter = new pg_db_adapter_1.PgDbAdapter({ connection });
    return dbAdapter;
}
function getCommandHandler(cmd, argv, config) {
    const dbAdapter = getDbAdapter(argv, config);
    const cwd = argv.cwd ?? process.cwd();
    const patch = argv.p ?? argv.patch ?? config.patch ?? "";
    const mm = new db_migration_manager_1.DbMigrationManager({ dbAdapter, cwd, patch });
    const commands = {
        deploy: async () => {
            await mm.deploy();
        },
        verify: async () => {
            await mm.verify();
        },
        revert: async () => {
            await mm.revert();
        },
        status: async () => {
            await mm.status();
        },
        list: async () => {
            await mm.list();
        },
    };
    return commands[cmd];
}
exports.getCommandHandler = getCommandHandler;
//# sourceMappingURL=commands.js.map