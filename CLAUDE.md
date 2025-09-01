# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

db-evo is a PostgreSQL database migration tool that manages versioned database schema changes with dependency resolution.

## Architecture

### Core Components

- **DbMigrationManager** (`src/core/db-migration-manager.ts`): Main orchestrator for migration operations
- **Migration** (`src/core/migration.ts`): Represents individual migration patches with dependency tracking
- **DbAdapter** (`src/core/db-adapter.ts`): Abstract interface for database operations
- **PgDbAdapter** (`src/pg/pg-db-adapter.ts`): PostgreSQL implementation of DbAdapter
- **MigrationResolver** (`src/core/migration-resolver.ts`): Resolves migration dependencies

### Key Concepts

- **Patches**: Numbered migration directories (e.g., `00`, `01`, `02`) containing SQL files
- **Operations**: Each patch can have `deploy/`, `revert/`, and `verify/` subdirectories
- **Dependencies**: Patches can depend on other patches via `db-evo.yaml` config files
- **Configuration**: Uses cosmiconfig to find `db-evo.yaml` files for patch configuration

## Development Commands

### Build and Test

```bash
pnpm run build        # Compile TypeScript
pnpm run watch        # Build in watch mode
pnpm run test         # Run Jest tests
pnpm run lint         # ESLint with auto-fix
pnpm run fmt          # Format with Prettier
```

### Development Tools

```bash
pnpm run clean        # Remove dist, coverage, build artifacts
pnpm run madge        # Check for circular dependencies
pnpm run cti          # Generate TypeScript index files
```

### Package Management

```bash
pnpm run link         # Link package globally (requires sudo)
pnpm run unlink       # Unlink package globally (requires sudo)
pnpm run pack         # Create package tarball
```

## CLI Usage

The tool is available as `db-evo` command with these operations:

- `deploy`: Apply migrations
- `revert`: Rollback migrations  
- `verify`: Validate applied migrations
- `status`: Show current migration state
- `list`: List all applied patches
- `info`: Show configuration details
- `tree`: Display dependency tree

Configuration is loaded via cosmiconfig from `db-evo.yaml` files.

## Database Schema

The tool creates a `_db_evo` table in the public schema to track applied migrations with columns: id, ver, at, note, checksum.

## Test Structure

Tests are in `spec/` with example migration structures in `spec/test/` showing the expected directory layout for patches.
