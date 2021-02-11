"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@art-ws/common");
const fs_utils_1 = require("./fs-utils");
const path_1 = tslib_1.__importDefault(require("path"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
class Migration {
    constructor(args) {
        this.args = args;
        this.name = fs_utils_1.getBaseName(args.cwd);
    }
    get dbAdapter() {
        return this.args.dbAdapter;
    }
    get cwd() {
        return this.args.cwd;
    }
    async getConfig() {
        if (!this.cfg) {
            const r = await common_1.lookupAndResolveJsonableFile(this.cwd, [
                "db-evo",
            ]);
            this.cfg = r.data;
        }
        return this.cfg;
    }
    async requires() {
        const cfg = await this.getConfig();
        return cfg.requires ?? cfg.depends ?? [];
    }
    async getParents() {
        return (await this.requires()).map((x) => this.args.resolver.resolve(x));
    }
    isApplied() {
        return this.dbAdapter.hasPatch(this.name);
    }
    // https://mozilla.github.io/nunjucks/getting-started.html
    async getSQLFiles(op) {
        const dir = path_1.default.join(this.cwd, op);
        if (!fs_utils_1.isDirExists(dir))
            return [];
        const ls = fs_utils_1.getFiles(dir);
        ls.sort();
        const result = ls
            .filter((x) => !(x.startsWith("_") || x.startsWith(".")) && x.endsWith(".sql"))
            .map((x) => path_1.default.join(dir, x));
        return result;
    }
    async deploy() {
        if (this.deployed)
            return;
        if (await this.isApplied()) {
            console.log(chalk_1.default.green(`Patch '${this.name}' already deployed.`));
            return;
        }
        for await (const p of await this.getParents()) {
            await p.deploy();
        }
        await this.dbAdapter.execFiles({
            ver: this.name,
            register: true,
            files: await this.getSQLFiles("deploy"),
        });
        console.log(chalk_1.default.green(`Deployed patch '${this.name}'`));
        this.deployed = true;
    }
    async verify() {
        if (this.verified)
            return;
        console.log(chalk_1.default.grey(`Verify '${this.name}' ...`));
        if (!(await this.isApplied()))
            throw new Error(`Patch '${this.name}' not deployed`);
        for await (const p of await this.getParents()) {
            await p.verify();
        }
        await this.dbAdapter.execFiles({
            files: await this.getSQLFiles("verify"),
        });
        console.log(chalk_1.default.green(`Patch '${this.name}' verify successful`));
        this.verified = true;
    }
    async revert() {
        if (this.reverted)
            return;
        await this.dbAdapter.execFiles({
            ver: this.name,
            unregister: true,
            files: await this.getSQLFiles("revert"),
        });
        console.log(chalk_1.default.green(`Patch '${this.name}' reverted`));
        this.reverted = true;
    }
}
exports.Migration = Migration;
//# sourceMappingURL=migration.js.map