export interface IDbPatchEntry {
  id: number
  ver: string
  tm: Date
  note: string
  checksum: string
}
export abstract class DbAdapter {
  abstract initialize(): Promise<void>
  abstract getEnvName(): string;
  abstract getConfig<T>(): T
  abstract hasPatch(ver: string): Promise<boolean>
  abstract registerPatch({ ver, note, checksum }): Promise<void>
  abstract unregisterPatch(ver: string): Promise<void>
  abstract execFiles(args: {
    ver?: string
    register?: boolean
    unregister?: boolean
    note?: string
    files: string[],
    dryRun?: boolean
  }): Promise<void>
  abstract list(): Promise<IDbPatchEntry[]>
}
