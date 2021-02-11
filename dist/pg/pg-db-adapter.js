"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgDbAdapter = void 0;
const common_1 = require("@art-ws/common");
const pg_1 = require("pg");
const db_adapter_1 = require("../core/db-adapter");
const psql_adapter_1 = require("./psql-adapter");
const q = (s) => (s ? `'${s}'` : "null");
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
`;
// https://node-postgres.com/
class PgDbAdapter extends db_adapter_1.DbAdapter {
    constructor(args) {
        super();
        this.args = args;
        this.schema = "public";
        this.table = "_db_evo";
        this.cfg = this.getClientConfig();
    }
    getClientConfig() {
        const { connection: c } = this.args;
        const result = {
            user: c.username || process.env.PGUSER || "postgres",
            database: c.dbname || process.env.PGDATABASE || process.env.USER || "",
            password: () => c.password || process.env.PGPASSWORD,
            port: c.port || Number(process.env.PGPORT) || 5432,
            host: c.host ?? process.env.PGHOST ?? "localhost",
        };
        common_1.assert({ dbname: result.database }).defined().string();
        return result;
    }
    async getPool() {
        if (!this.pool) {
            this.pool = new pg_1.Pool(this.cfg);
            await this.pool.connect();
        }
        return this.pool;
    }
    get fullTableName() {
        return `"${this.schema}"."${this.table}"`;
    }
    async execSQL(sql) {
        const pool = await this.getPool();
        //console.log(`SQL: [${sql}]`)
        const r = await pool.query(sql);
        //console.log(`Affected rows: ${r.rowCount}`)
        return r.rows ?? [];
    }
    async checkConnection() {
        await this.execSQL("SELECT NOW()");
    }
    async createDb() {
        const psql = new psql_adapter_1.PSqlAdapter(this.cfg);
        await psql.createDb();
    }
    async ensureDatabase() {
        try {
            await this.checkConnection();
        }
        catch (e) {
            if (e.code === "3D000") {
                await this.createDb();
            }
            else
                throw e;
        }
    }
    async isTableExists({ schema, table }) {
        const r = (await this.execSQL(`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE  table_schema = ${q(schema)}
      AND    table_name   = ${q(table)}
      )`))[0];
        return r?.exists;
    }
    async createSystemTable() {
        await this.execSQL(getTableDDL(this));
    }
    async ensureSystemTable() {
        const isExists = await this.isTableExists(this);
        if (!isExists) {
            await this.createSystemTable();
        }
    }
    async initialize() {
        await this.ensureDatabase();
        await this.ensureSystemTable();
    }
    async hasPatch(ver) {
        common_1.assert({ ver }).defined().string();
        const r = await this.execSQL(`select true as exists from ${this.fullTableName} where ver = '${ver}'`);
        return !!r[0]?.exists;
    }
    async registerPatch({ ver, note, checksum, }) {
        common_1.assert({ ver }).defined().string();
        await this.execSQL(`
    INSERT INTO ${this.fullTableName} (ver, note, checksum)
    VALUES(${q(ver)}, ${q(note)}, ${q(checksum)})`);
    }
    async unregisterPatch(ver) {
        common_1.assert({ ver }).defined().string();
        await this.execSQL(`delete from ${this.fullTableName} where ver = ${q(ver)}`);
    }
    async execFiles(args) {
        if (args.register || args.unregister) {
            common_1.assert({ ver: args.ver }).defined().string();
        }
        const psql = new psql_adapter_1.PSqlAdapter(this.cfg);
        for (const file of args.files) {
            await psql.execFile(file);
        }
        if (args.register) {
            await this.registerPatch({ ver: args.ver, note: args.note });
        }
        if (args.unregister) {
            await this.unregisterPatch(args.ver);
        }
    }
    list() {
        return this.execSQL(`select * from ${this.fullTableName} order by id`);
    }
}
exports.PgDbAdapter = PgDbAdapter;
//# sourceMappingURL=pg-db-adapter.js.map