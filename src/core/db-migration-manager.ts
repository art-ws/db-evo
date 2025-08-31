import { assert } from "@art-ws/common"
import chalk from "chalk"
import { ClientConfig } from "pg"
import { DbAdapter } from "./db-adapter"
import { getDirectories } from "./fs-utils"
import { Migration } from "./migration"
import { MigrationResolver } from "./migration-resolver"

export interface DbMigrationManagerArgs {
  cwd: string
  roots: string[]
  patch: string
  dbAdapter: DbAdapter
}

export class DbMigrationManager {
  constructor(private args: DbMigrationManagerArgs) {}

  get cwd(): string {
    return this.args.cwd
  }

  get roots(): string[] {
    return [this.cwd, ...(this.args.roots ?? [])].filter(Boolean)
  }

  get dbAdapter(): DbAdapter {
    return this.args.dbAdapter
  }

  async resolvePatchName(): Promise<string> {
    const dirs = getDirectories(this.cwd)
    dirs.sort()
    return dirs[dirs.length - 1] ?? ""
  }

  async getPatchName(): Promise<string> {
    return this.args.patch || (await this.resolvePatchName())
  }

  async deploy(args: { dryRun: boolean; noInstall?: boolean }): Promise<void> {
    await this.doOperation((x) => x.deploy(args))
  }

  async verify(): Promise<void> {
    await this.doOperation((x) => x.verify())
  }

  async revert(): Promise<void> {
    await this.doOperation((x) => x.revert())
  }

  private async doOperation(
    fn: (x: Migration) => Promise<void>
  ): Promise<void> {
    console.log(chalk.grey(`Initialize...`))
    await this.dbAdapter.initialize()
    const migrationResolver = new MigrationResolver({
      roots: this.roots,
      dbAdapter: this.dbAdapter,
    })
    const patch = await this.getPatchName()
    assert({ patch }).defined().string()
    const root = migrationResolver.resolve(patch)
    console.log(chalk.grey(`Apply for patch '${root.name}'...`))
    await fn(root)
  }

  async status(): Promise<void> {
    const patch = await this.getPatchName()
    const ls = await this.dbAdapter.list()
    const last = ls[ls.length - 1]
    if (last) {
      console.log(
        chalk.yellow(
          `Last patch '${last.ver}' ${
            last.note ? `(${last.note})` : ""
          } installed at ${last.tm?.toISOString() || "<unknown>"}`
        )
      )
    }
    console.log(
      chalk.yellow(`Expected patch is '${patch}'`),
      last?.ver === patch
        ? chalk.green(`- DEPLOYED`)
        : chalk.red(` - NOT DEPLOYED`)
    )
  }

  async list(): Promise<void> {
    const ls = await this.dbAdapter.list()
    console.log(ls)
  }

  async info(): Promise<void> {
    const patch = await this.getPatchName()
    const cfg = this.dbAdapter.getConfig<ClientConfig>()

    const print = (a: string, b: string) =>
      `${chalk.white(a)} : ${chalk.yellow(b)}`
    console.log(`
${print("Working dir", this.cwd)}
${print("Env", this.dbAdapter.getEnvName())}
${print("Patch", patch)}
${print("DB", cfg.database)}
${print("Host", cfg.host)}
${print("Port", cfg.port + "")}
${print("User", cfg.user)}
`)
  }

  async tree(): Promise<void> {
    await this.doOperation((x) => x.tree())
  }

  async template(): Promise<void> {}
}
