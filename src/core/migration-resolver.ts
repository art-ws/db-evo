import { Migration } from "./migration"
import path from "path"
import { isDirExists } from "./fs-utils"
import { DbAdapter } from "./db-adapter"

export class MigrationResolver {
  private cache = new Map<string, Migration>()

  constructor(public args: { roots: string[]; dbAdapter: DbAdapter }) {}

  private doResolve(name: string): Migration {
    const dir = this.args.roots
      .map((s) => path.join(s, name))
      .find((s) => isDirExists(s))

    if (!dir) throw new Error(`Dir '${name}' not exists`)
    return new Migration({
      cwd: dir,
      name,
      resolver: this,
      dbAdapter: this.args.dbAdapter,
    })
  }

  resolve(name: string): Migration {
    let m = this.cache.get(name)
    if (!m) {
      m = this.doResolve(name)
      this.cache.set(name, m)
    }
    return m
  }
}
