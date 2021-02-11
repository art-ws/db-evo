"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PSqlAdapter = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@art-ws/common");
const child_process_1 = require("child_process");
const path_1 = tslib_1.__importDefault(require("path"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
// https://node-postgres.com/
class PSqlAdapter {
    constructor(config) {
        this.config = config;
    }
    getOptions() {
        return `--host=${this.config.host} --port=${this.config.port} --username=${this.config.user} `;
    }
    get pwd() {
        return this.config.password();
    }
    // https://nodejs.org/api/child_process.html#child_process_class_childprocess
    async exec(cmd, opts, o) {
        return new Promise((resolve, reject) => {
            const parts = [];
            process.env.PGPASSWORD = this.pwd;
            // parts.push(`PGPASSWORD=${this.pwd}`)
            parts.push(`${cmd} ${this.getOptions()} ${opts}`);
            const c = parts.join(" && ");
            console.log(chalk_1.default.grey(`[${c}]`));
            const p = child_process_1.exec(c, o, (error, stdout, stderr) => {
                if (error)
                    return reject(error);
                if (stderr) {
                    reject(new Error(`SQL error (see stderr for details)`));
                    console.error(chalk_1.default.redBright(`[ERROR] ${cmd} >`), chalk_1.default.red(stderr));
                }
                else {
                    if (stdout)
                        console.log(chalk_1.default.whiteBright(`${cmd} >`), chalk_1.default.white(stdout));
                    resolve();
                }
            });
            p.on("exit", (code) => {
                if (code !== 0) {
                    const msg = `Exit code: ${code} [${c}]`;
                    console.error(chalk_1.default.red(msg));
                    reject(msg);
                }
            });
        });
    }
    async createDb(dbname) {
        dbname = dbname ?? this.config.database ?? "";
        common_1.assert({ dbname }).string().defined();
        console.log(chalk_1.default.yellow(`Create DB: ${dbname}`));
        await this.exec(`createdb`, dbname);
    }
    async execFile(file) {
        const cwd = path_1.default.dirname(file);
        await this.exec(`psql`, `--dbname=${this.config.database} --file=${file} --echo-errors`, { cwd });
    }
}
exports.PSqlAdapter = PSqlAdapter;
//# sourceMappingURL=psql-adapter.js.map