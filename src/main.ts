import { cosmiconfigSync } from "cosmiconfig"
import { Argv, getCommandHandler } from "./commands"
import chalk from "chalk"

export async function main(args: { argv: Argv; app: string }) {
  const { argv, app } = args
  const explorerSync = cosmiconfigSync(app)
  const loaded = explorerSync.search()
  if (loaded?.isEmpty) throw new Error(`Config for '${app}' not found`)
  const cmd = argv._[0]
  const config = loaded?.config ?? {}
  const o = config[cmd]
  const handler = getCommandHandler(cmd, argv, config)
  try {
    const exitCode = (await handler(o)) ?? 0
    process.exit(exitCode)
  } catch (e) {
    console.error(chalk.red(e.message))
    throw e
  }
}
