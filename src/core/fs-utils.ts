import { Dirent, existsSync, readdirSync } from "fs"
import path from "path"

export const listItems = (source: string, fn: (x: Dirent) => boolean) =>
  readdirSync(source, { withFileTypes: true })
    .filter((dirent) => fn(dirent))
    .map((dirent) => dirent.name)

export const getDirectories = (source: string) =>
  listItems(source, (x) => x.isDirectory())

export const getFiles = (source: string) => listItems(source, (x) => x.isFile())

export const isDirExists = (dir: string) => existsSync(dir)

export const getBaseName = (p: string) => path.basename(p)
