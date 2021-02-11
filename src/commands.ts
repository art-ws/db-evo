import { DbAdapter } from "./core"
import { DbMigrationManager } from "./core/db-migration-manager"
import { PgDbAdapter, PgDbConnection } from "./pg/pg-db-adapter"

export interface Argv extends PgDbConnection {
  _: CommandName[]
  cwd: string
  env: string
  engine: string
  p: string
  patch: string
}

export interface Config {
  pg: {
    [env: string]: PgDbConnection
  }
  patch: string
  env: string
  engine: EngineType
}

export type CommandHandler<O> = (o?: O) => Promise<any>
export interface CommandsController {
  deploy: CommandHandler<unknown>
  revert: CommandHandler<unknown>
  verify: CommandHandler<unknown>
  status: CommandHandler<unknown>
  list: CommandHandler<unknown>
}

type CommandName = keyof CommandsController

type EngineType = "pg"

function getDbAdapter(argv: Argv, cfg: Config): DbAdapter {
  const engine = (argv.engine ?? cfg.engine ?? "pg") as EngineType
  const env = argv.env ?? cfg.env ?? "default"
  const connection = cfg[engine][env]

  const props: (keyof PgDbConnection)[] = [
    "dbname",
    "host",
    "password",
    "port",
    "username",
  ]
  props.forEach((prop) => {
    connection[prop] = (argv[prop] ?? connection[prop]) as never
  })

  const dbAdapter = new PgDbAdapter({ connection })
  return dbAdapter
}

export function getCommandHandler(
  cmd: CommandName,
  argv: Argv,
  config: Config
): CommandHandler<unknown> {
  const dbAdapter = getDbAdapter(argv, config)
  const cwd = argv.cwd ?? process.cwd()
  const patch = argv.p ?? argv.patch ?? config.patch ?? ""
  const mm = new DbMigrationManager({ dbAdapter, cwd, patch })
  const commands: CommandsController = {
    deploy: async () => {
      await mm.deploy()
    },
    verify: async () => {
      await mm.verify()
    },
    revert: async () => {
      await mm.revert()
    },
    status: async () => {
      await mm.status()
    },
    list: async () => {
      await mm.list()
    },
  }

  return commands[cmd]
}
