import { lookupAndResolveJsonableFile } from "@art-ws/common"
import { DbAdapter } from "./db-adapter"
import { getBaseName, getFiles, isDirExists } from "./fs-utils"
import path from "path"
import chalk from "chalk"
export interface IMigrationResolver {
  resolve(name: string): Migration
}

export interface MigrationConfig {
  depends: string[]
  requires: string[]
}
export class Migration {
  name: string
  cfg: MigrationConfig

  constructor(
    public args: {
      cwd: string
      resolver: IMigrationResolver
      dbAdapter: DbAdapter
    }
  ) {
    this.name = getBaseName(args.cwd)
  }

  get dbAdapter(): DbAdapter {
    return this.args.dbAdapter
  }

  get cwd(): string {
    return this.args.cwd
  }

  async getConfig(): Promise<MigrationConfig> {
    if (!this.cfg) {
      const r = await lookupAndResolveJsonableFile<MigrationConfig>(this.cwd, [
        "db-evo",
      ])
      this.cfg = r.data
    }
    return this.cfg
  }

  async requires(): Promise<string[]> {
    const cfg = await this.getConfig()
    return cfg.requires ?? cfg.depends ?? []
  }

  async getParents(): Promise<Migration[]> {
    return (await this.requires()).map((x) => this.args.resolver.resolve(x))
  }

  isApplied(): Promise<boolean> {
    return this.dbAdapter.hasPatch(this.name)
  }

  // https://mozilla.github.io/nunjucks/getting-started.html
  async getSQLFiles(op: string): Promise<string[]> {
    const dir = path.join(this.cwd, op)
    if (!isDirExists(dir)) return []
    const ls = getFiles(dir)
    ls.sort()

    const result = ls
      .filter(
        (x) => !(x.startsWith("_") || x.startsWith(".")) && x.endsWith(".sql")
      )
      .map((x) => path.join(dir, x))
    return result
  }

  deployed: boolean

  async deploy(): Promise<void> {
    if (this.deployed) return
    if (await this.isApplied()) {
      console.log(chalk.green(`Patch '${this.name}' already deployed.`))
      return
    }

    for await (const p of await this.getParents()) {
      await p.deploy()
    }

    await this.dbAdapter.execFiles({
      ver: this.name,
      register: true,
      files: await this.getSQLFiles("deploy"),
    })

    console.log(chalk.green(`Deployed patch '${this.name}'`))

    this.deployed = true
  }

  verified: boolean

  async verify(): Promise<void> {
    if (this.verified) return
    console.log(chalk.grey(`Verify '${this.name}' ...`))
    if (!(await this.isApplied()))
      throw new Error(`Patch '${this.name}' not deployed`)
    for await (const p of await this.getParents()) {
      await p.verify()
    }

    await this.dbAdapter.execFiles({
      files: await this.getSQLFiles("verify"),
    })

    console.log(chalk.green(`Patch '${this.name}' verify successful`))
    this.verified = true
  }

  reverted: boolean

  async revert(): Promise<void> {
    if (this.reverted) return
    await this.dbAdapter.execFiles({
      ver: this.name,
      unregister: true,
      files: await this.getSQLFiles("revert"),
    })
    console.log(chalk.green(`Patch '${this.name}' reverted`))
    this.reverted = true
  }
}
