import { Options, SqliteDriver } from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Migrator } from '@mikro-orm/migrations';
import { ExtendedEntityRepository } from "./common/repositories/extended-entity-repository";

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
        transactional: true, // run each migration inside transaction
        disableForeignKeys: true, // try to disable foreign_key_checks (or equivalent)
        emit: 'ts', // migration generation mode
      },
    entityRepository: ExtendedEntityRepository
};

export default config;