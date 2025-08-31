import { assert, lookupAndResolveJsonableFile } from "@art-ws/common"
import { DbAdapter } from "./db-adapter"
import { getFiles, isDirExists } from "./fs-utils"
import path from "path"
import chalk from "chalk"

const pad = (n: number, s: string = " "): string => {
  let r = ""
  for (let i = 0; i < n; i++) {
    r += s
  }
  return r
}
export interface IMigrationResolver {
  resolve(name: string): Migration
}

export interface MigrationConfig {
  depends: string[]
  requires: string[]
  includes: string[]
}
export class Migration {
  name: string
  cfg: MigrationConfig

  constructor(
    public args: {
      cwd: string
      name: string
      resolver: IMigrationResolver
      dbAdapter: DbAdapter
    }
  ) {
    const { name } = args
    assert({ name }).string().defined()
    this.name = name
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

  async includes(): Promise<string[]> {
    const cfg = await this.getConfig()
    return cfg.includes ?? []
  }

  async requires(): Promise<string[]> {
    const cfg = await this.getConfig()
    const result = [
      ...(cfg.requires ?? cfg.depends ?? []),
      ...(cfg.includes ?? []),
    ].filter(Boolean)
    return result
  }

  async getParents(): Promise<Migration[]> {
    return (await this.requires()).map((x) => this.args.resolver.resolve(x))
  }

  async getIncludes(): Promise<Migration[]> {
    return (await this.includes()).map((x) => this.args.resolver.resolve(x))
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

    const isIgnore = (s: string): boolean =>
      s.startsWith("_") || s.startsWith(".")

    const result = ls
      .filter((x) => !isIgnore(x) && x.endsWith(".sql"))
      .map((x) => path.join(dir, x))
    return result
  }

  private handled: unknown
  async doOnce<T = void>(fn: () => Promise<T>): Promise<T> {
    if (!this.handled) {
      this.handled = (await fn()) ?? true
    }
    return this.handled as T
  }

  async deploy(args: { dryRun: boolean, noInstall?: boolean }): Promise<void> {
    await this.doOnce(async () => {
      if (await this.isApplied()) {
        console.log(chalk.green(`Patch '${this.name}' already deployed.`))
        return
      }

      for await (const p of await this.getParents()) {
        await p.deploy(args)
      }

      await this.dbAdapter.execFiles({
        ver: this.name,
        register: !args.noInstall,
        files: await this.getSQLFiles("deploy"),
        dryRun: !!args?.dryRun,
      })

      console.log(chalk.green(`Deployed patch '${this.name}'`))
    })
  }

  async verify(): Promise<void> {
    await this.doOnce(async () => {
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
    })
  }

  async revert(): Promise<void> {
    await this.doOnce(async () => {
      await this.dbAdapter.execFiles({
        ver: this.name,
        unregister: true,
        files: await this.getSQLFiles("revert"),
      })
      for await (const p of await this.getIncludes()) {
        await p.revert()
      }
      console.log(chalk.green(`Patch '${this.name}' reverted`))
    })
  }

  async doTree(level: number): Promise<void> {
    await this.doOnce(async () => {
      const isApplied = await this.isApplied()
      const color = isApplied ? chalk.green.bind(chalk) : chalk.red.bind(chalk)
      console.log(
        color(`${pad(level, "  ")}'${this.name}'`) +
          chalk.white(" - ") +
          chalk.grey(this.cwd)
      )
      for await (const p of await this.getParents()) {
        await p.doTree(level + 1)
      }
    })
  }

  async tree(): Promise<void> {
    await this.doTree(0)
  }
}
