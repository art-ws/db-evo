"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationResolver = void 0;
const tslib_1 = require("tslib");
const migration_1 = require("./migration");
const path_1 = tslib_1.__importDefault(require("path"));
const fs_utils_1 = require("./fs-utils");
class MigrationResolver {
    constructor(args) {
        this.args = args;
        this.cache = new Map();
    }
    doResolve(name) {
        const cwd = path_1.default.join(this.args.cwd, name);
        if (!fs_utils_1.isDirExists(cwd))
            throw new Error(`Dir '${cwd}' not exists`);
        return new migration_1.Migration({
            cwd,
            resolver: this,
            dbAdapter: this.args.dbAdapter,
        });
    }
    resolve(name) {
        let m = this.cache.get(name);
        if (!m) {
            m = this.doResolve(name);
            this.cache.set(name, m);
        }
        return m;
    }
}
exports.MigrationResolver = MigrationResolver;
//# sourceMappingURL=migration-resolver.js.map