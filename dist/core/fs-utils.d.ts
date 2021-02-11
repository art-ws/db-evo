import { Dirent } from "fs";
export declare const listItems: (source: string, fn: (x: Dirent) => boolean) => string[];
export declare const getDirectories: (source: string) => string[];
export declare const getFiles: (source: string) => string[];
export declare const isDirExists: (dir: string) => boolean;
export declare const getBaseName: (p: string) => string;
//# sourceMappingURL=fs-utils.d.ts.map