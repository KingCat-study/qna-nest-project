import { Options, SqliteDriver } from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Migrator } from '@mikro-orm/migrations';

const config: Options = {
    driver: SqliteDriver,
    dbName: 'sqlite.db',
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    metadataProvider: TsMorphMetadataProvider,
    debug: true,
    extensions: [Migrator],
    migrations: {
        tableName: 'migrations', // name of database table with log of executed transactions
        path: process.cwd() + '/migrations', // path to folder with migration files
        glob: '!(*.d).{js,ts}', // how to match migration files (all .js and .ts files, but not .d.ts)
        transactional: true, // run each migration inside transaction
        disableForeignKeys: true, // try to disable foreign_key_checks (or equivalent)
        allOrNothing: true, // run all migrations in current batch in master transaction
        emit: 'ts', // migration generation mode
      },
};

export default config;