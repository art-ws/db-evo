# db-evo

PostgreSQL database migration tool with dependency resolution and versioned schema management.

## Features

- **Versioned Migrations**: Organize database changes in numbered patches
- **Dependency Resolution**: Define and resolve migration dependencies
- **Operation Types**: Support for deploy, revert, and verify operations
- **PostgreSQL Support**: Native PostgreSQL integration with connection pooling
- **Dry Run Mode**: Preview changes before applying them
- **Migration Tracking**: Automatic tracking of applied migrations

## Requirements

- **psql**: PostgreSQL command-line client must be installed
- **Platform**: Currently supports Linux only (other platforms coming soon)

## Installation

```bash
npm install -g db-evo
```

## Quick Start

1. Create a migration directory structure:

```text
migrations/
├── 00/
│   ├── db-evo.yaml
│   └── deploy/
│       └── 01-create-users.sql
├── 01/
│   ├── db-evo.yaml
│   └── deploy/
│       └── 01-create-posts.sql
```

2. Configure database connection in `db-evo.yaml`:

```yaml
pg:
  default:
    dbname: myapp
    host: localhost
    port: 5432
    username: postgres
    password: secret
```

3. Deploy migrations:

```bash
db-evo deploy
```

## Commands

- `db-evo deploy` - Apply pending migrations
- `db-evo revert` - Rollback the latest migration
- `db-evo verify` - Validate applied migrations
- `db-evo status` - Show current migration state
- `db-evo list` - List all applied patches
- `db-evo info` - Display configuration details
- `db-evo tree` - Show migration dependency tree

## Configuration

Create `db-evo.yaml` files to configure migrations:

```yaml
# Root configuration
patch: "01" # Latest migration
env: "default"
engine: "pg" # Only supported
roots: # Each migration is a folder, so let's specify the root dir
  - "~/workspace/projects/myapp/db/migrations"
pg:
  default:
    dbname: myapp_dev
    host: localhost
    port: 5432
    username: postgres
    password: secret
  production:
    dbname: myapp_prod
    host: prod.example.com

# Per-migration configuration
depends: ["00"]  # Require patch 00 before applying
includes: ["shared"]  # Include shared migrations
```

## Migration Structure

Each migration patch follows this structure:

```text
patch-name/
├── db-evo.yaml     # Configuration (optional)
├── vars.yaml       # Variables for templates (optional)
├── deploy/         # Forward migration scripts
│   ├── 01.sql
│   └── 02.sql
├── revert/         # Rollback scripts (optional)
│   └── 01.sql
└── verify/         # Verification scripts (optional)
    └── 01.sql
```

## Options

- `--env <env>` - Target environment (default: "default")
- `--patch <name>` - Specific patch to operate on
- `--dry-run` - Preview changes without applying
- `--engine <type>` - Database engine (currently only "pg")

## License

MIT
