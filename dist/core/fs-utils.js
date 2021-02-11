"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBaseName = exports.isDirExists = exports.getFiles = exports.getDirectories = exports.listItems = void 0;
const tslib_1 = require("tslib");
const fs_1 = require("fs");
const path_1 = tslib_1.__importDefault(require("path"));
const listItems = (source, fn) => fs_1.readdirSync(source, { withFileTypes: true })
    .filter((dirent) => fn(dirent))
    .map((dirent) => dirent.name);
exports.listItems = listItems;
const getDirectories = (source) => exports.listItems(source, (x) => x.isDirectory());
exports.getDirectories = getDirectories;
const getFiles = (source) => exports.listItems(source, (x) => x.isFile());
exports.getFiles = getFiles;
const isDirExists = (dir) => fs_1.existsSync(dir);
exports.isDirExists = isDirExists;
const getBaseName = (p) => path_1.default.basename(p);
exports.getBaseName = getBaseName;
//# sourceMappingURL=fs-utils.js.map