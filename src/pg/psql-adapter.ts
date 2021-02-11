import { assert } from "@art-ws/common"
import { ClientConfig } from "pg"
import { exec, ExecOptions } from "child_process"
import path from "path"
import chalk from "chalk"

// https://node-postgres.com/
export class PSqlAdapter {
  constructor(public config: ClientConfig) {}

  getOptions(): string {
    return `--host=${this.config.host} --port=${this.config.port} --username=${this.config.user} `
  }

  get pwd(): string {
    return (this.config.password as Function)()
  }

  // https://nodejs.org/api/child_process.html#child_process_class_childprocess
  async exec(
    cmd: string,
    opts: string,
    o?: Partial<ExecOptions>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const parts: string[] = []

      process.env.PGPASSWORD = this.pwd
      // parts.push(`PGPASSWORD=${this.pwd}`)
      parts.push(`${cmd} ${this.getOptions()} ${opts}`)
      const c = parts.join(" && ")
      console.log(chalk.grey(`[${c}]`))

      const p = exec(c, o, (error: Error, stdout: string, stderr: string) => {
        if (error) return reject(error)
        if (stderr) {
          reject(new Error(`SQL error (see stderr for details)`))
          console.error(chalk.redBright(`[ERROR] ${cmd} >`), chalk.red(stderr))
        } else {
          if (stdout)
            console.log(chalk.whiteBright(`${cmd} >`), chalk.white(stdout))
          resolve()
        }
      })

      p.on("exit", (code: number) => {
        if (code !== 0) {
          const msg = `Exit code: ${code} [${c}]`
          console.error(chalk.red(msg))
          reject(msg)
        }
      })
    })
  }

  async createDb(dbname?: string) {
    dbname = dbname ?? this.config.database ?? ""
    assert({ dbname }).string().defined()
    console.log(chalk.yellow(`Create DB: ${dbname}`))
    await this.exec(`createdb`, dbname)
  }

  async execFile(file: string): Promise<void> {
    const cwd = path.dirname(file)
    await this.exec(
      `psql`,
      `--dbname=${this.config.database} --file=${file} --echo-errors`,
      { cwd }
    )
  }
}
