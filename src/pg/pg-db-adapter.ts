import { assert } from "@art-ws/common"
import { ClientConfig, Pool } from "pg"
import { DbAdapter, IDbPatchEntry } from "../core/db-adapter"
import { PSqlAdapter } from "./psql-adapter"

export interface PgDbConnection {
  dbname: string
  host: string
  port: number
  username: string
  password: string
}

const q = (s: string) => (s ? `'${s}'` : "null")

const getTableDDL = ({ table, schema }) => `
CREATE TABLE ${schema}.${table} (
	id        serial         NOT NULL,
	ver       varchar(128)   NOT NULL,
  tm        timestamptz    NOT NULL DEFAULT now(),
	note      varchar(512)   NULL,
	checksum  varchar(128)   NOT NULL,	
  CONSTRAINT ${table}_pkey PRIMARY KEY (id),
	CONSTRAINT ${table}_unique_ver UNIQUE (ver)
)
`
// https://node-postgres.com/
export class PgDbAdapter extends DbAdapter {
  cfg: ClientConfig
  schema = "public"
  table = "_db_evo"
  pool: Pool

  constructor(public args: { connection: PgDbConnection }) {
    super()
    this.cfg = this.getClientConfig()
  }

  private getClientConfig(): ClientConfig {
    const { connection: c } = this.args
    const result = {
      user: c.username || process.env.PGUSER || "postgres",
      database: c.dbname || process.env.PGDATABASE || process.env.USER || "",
      password: () => c.password || process.env.PGPASSWORD,
      port: c.port || Number(process.env.PGPORT) || 5432,
      host: c.host ?? process.env.PGHOST ?? "localhost",
    }
    assert({ dbname: result.database }).defined().string()
    return result
  }

  async getPool(): Promise<Pool> {
    if (!this.pool) {
      this.pool = new Pool(this.cfg)
      await this.pool.connect()
    }
    return this.pool
  }

  get fullTableName(): string {
    return `"${this.schema}"."${this.table}"`
  }

  async execSQL<T>(sql: string): Promise<T[]> {
    const pool = await this.getPool()
    //console.log(`SQL: [${sql}]`)
    const r = await pool.query(sql)
    //console.log(`Affected rows: ${r.rowCount}`)
    return r.rows ?? []
  }

  async checkConnection() {
    await this.execSQL("SELECT NOW()")
  }

  async createDb() {
    const psql = new PSqlAdapter(this.cfg)
    await psql.createDb()
  }

  async ensureDatabase() {
    try {
      await this.checkConnection()
    } catch (e) {
      if (e.code === "3D000") {
        await this.createDb()
      } else throw e
    }
  }

  async isTableExists({ schema, table }): Promise<boolean> {
    const r = (
      await this.execSQL<{ exists: boolean }>(`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE  table_schema = ${q(schema)}
      AND    table_name   = ${q(table)}
      )`)
    )[0]

    return r?.exists
  }

  async createSystemTable() {
    await this.execSQL(getTableDDL(this))
  }

  async ensureSystemTable() {
    const isExists = await this.isTableExists(this)
    if (!isExists) {
      await this.createSystemTable()
    }
  }

  async initialize(): Promise<void> {
    await this.ensureDatabase()
    await this.ensureSystemTable()
  }

  async hasPatch(ver: string): Promise<boolean> {
    assert({ ver }).defined().string()
    const r = await this.execSQL<{ exists: boolean }>(
      `select true as exists from ${this.fullTableName} where ver = '${ver}'`
    )
    return !!r[0]?.exists
  }

  async registerPatch({
    ver,
    note,
    checksum,
  }: {
    ver: string
    note?: string
    checksum?: string
  }): Promise<void> {
    assert({ ver }).defined().string()
    await this.execSQL(`
    INSERT INTO ${this.fullTableName} (ver, note, checksum)
    VALUES(${q(ver)}, ${q(note)}, ${q(checksum)})`)
  }

  async unregisterPatch(ver: string): Promise<void> {
    assert({ ver }).defined().string()
    await this.execSQL(
      `delete from ${this.fullTableName} where ver = ${q(ver)}`
    )
  }

  async execFiles(args: {
    ver?: string
    register?: boolean
    unregister?: boolean
    note?: string
    files: string[]
  }): Promise<void> {
    if (args.register || args.unregister) {
      assert({ ver: args.ver }).defined().string()
    }
    const psql = new PSqlAdapter(this.cfg)
    for (const file of args.files) {
      await psql.execFile(file)
    }
    if (args.register) {
      await this.registerPatch({ ver: args.ver, note: args.note })
    }
    if (args.unregister) {
      await this.unregisterPatch(args.ver)
    }
  }

  list(): Promise<IDbPatchEntry[]> {
    return this.execSQL(`select * from ${this.fullTableName} order by id`)
  }
}
