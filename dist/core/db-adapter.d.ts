export interface IDbPatchEntry {
    id: number;
    ver: string;
    tm: Date;
    note: string;
    checksum: string;
}
export declare abstract class DbAdapter {
    abstract initialize(): Promise<void>;
    abstract hasPatch(ver: string): Promise<boolean>;
    abstract registerPatch({ ver, note, checksum }: {
        ver: any;
        note: any;
        checksum: any;
    }): Promise<void>;
    abstract unregisterPatch(ver: string): Promise<void>;
    abstract execFiles(args: {
        ver?: string;
        register?: boolean;
        unregister?: boolean;
        note?: string;
        files: string[];
    }): Promise<void>;
    abstract list(): Promise<IDbPatchEntry[]>;
}
//# sourceMappingURL=db-adapter.d.ts.map