import { Migration } from "./migration"
import path from "path"
import { isDirExists } from "./fs-utils"
import { DbAdapter } from "./db-adapter"

export class MigrationResolver {
  private cache = new Map<string, Migration>()

  constructor(public args: { cwd: string; dbAdapter: DbAdapter }) {}

  private doResolve(name: string): Migration {
    const cwd = path.join(this.args.cwd, name)
    if (!isDirExists(cwd)) throw new Error(`Dir '${cwd}' not exists`)
    return new Migration({
      cwd,
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
