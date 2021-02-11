"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const tslib_1 = require("tslib");
const cosmiconfig_1 = require("cosmiconfig");
const commands_1 = require("./commands");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
async function main(args) {
    const { argv, app } = args;
    const explorerSync = cosmiconfig_1.cosmiconfigSync(app);
    const loaded = explorerSync.search();
    if (loaded?.isEmpty)
        throw new Error(`Config for '${app}' not found`);
    const cmd = argv._[0];
    const config = loaded?.config ?? {};
    const o = config[cmd];
    const handler = commands_1.getCommandHandler(cmd, argv, config);
    try {
        const exitCode = (await handler(o)) ?? 0;
        process.exit(exitCode);
    }
    catch (e) {
        console.error(chalk_1.default.red(e.message));
        throw e;
    }
}
exports.main = main;
//# sourceMappingURL=main.js.map