#!/usr/bin/env node
const path = require("path")
const package = require(path.join(__dirname, "../package.json"))
const { main } = require("../dist/index")

const app = Object.keys(package.bin)[0]

// https://www.npmjs.com/package/yargs
const { argv } = require("yargs")
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .option("dry-run", {
    type: "boolean",
    description: "Dry run",
  })
  .option("patch", {
    type: "string",
    description: "Patch name",
  })
  .option("env", {
    type: "string",
    description: "Environment",
  })
  .option("engine", {
    type: "string",
    description: "Db Engine (pg: default)",
  })
  .usage(`Usage: ${app} up`)
  .epilog(['https://art-ws.org', package.description ?? "", 'Copyright 2021'].join(', '))
  .example(`${app} up`, 'Apply database migrations')

main({ argv, app }).catch((e) => {
  console.error(e)
  process.exit(1)
})
