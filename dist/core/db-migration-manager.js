"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbMigrationManager = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@art-ws/common");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs_utils_1 = require("./fs-utils");
const migration_resolver_1 = require("./migration-resolver");
class DbMigrationManager {
    constructor(args) {
        this.args = args;
    }
    get cwd() {
        return this.args.cwd;
    }
    get dbAdapter() {
        return this.args.dbAdapter;
    }
    async resolvePatchName() {
        const dirs = fs_utils_1.getDirectories(this.cwd);
        dirs.sort();
        return dirs[dirs.length - 1] ?? "";
    }
    async getPatchName() {
        return this.args.patch || (await this.resolvePatchName());
    }
    async deploy() {
        await this.doOperation((x) => x.deploy());
    }
    async verify() {
        await this.doOperation((x) => x.verify());
    }
    async revert() {
        await this.doOperation((x) => x.revert());
    }
    async doOperation(fn) {
        console.log(chalk_1.default.grey(`Initialize...`));
        await this.dbAdapter.initialize();
        const migrationResolver = new migration_resolver_1.MigrationResolver({
            cwd: this.cwd,
            dbAdapter: this.dbAdapter,
        });
        const patch = await this.getPatchName();
        common_1.assert({ patch }).defined().string();
        const root = migrationResolver.resolve(patch);
        console.log(chalk_1.default.grey(`Apply for patch '${root.name}'...`));
        await fn(root);
    }
    async status() {
        const patch = await this.getPatchName();
        const ls = await this.dbAdapter.list();
        const last = ls[ls.length - 1];
        if (last) {
            console.log(chalk_1.default.yellow(`Last patch '${last.ver}' ${last.note ? `(${last.note})` : ""}installed at ${last.tm}`));
        }
        console.log(chalk_1.default.yellow(`Expected patch is '${patch}'`), last?.ver === patch
            ? chalk_1.default.green(`- DEPLOYED`)
            : chalk_1.default.red(` - NOT DEPLOYED`));
    }
    async list() {
        const ls = await this.dbAdapter.list();
        console.log(ls);
    }
}
exports.DbMigrationManager = DbMigrationManager;
//# sourceMappingURL=db-migration-manager.js.map