import { Options, SqliteDriver } from "@mikro-orm/sqlite";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { Migrator } from '@mikro-orm/migrations';
import { ExtendedEntityRepository } from "./common/repositories/extended-entity-repository";
import { User } from "./modules/user/entities/user.entity";
import { Like } from "./modules/like/entities/like.entity";
import { Question } from "./modules/question/entities/question.entity";
import { TimestampsEntity } from "./common/entities/timestamps.entity";
import { Login } from "./modules/auth/entities/login.entity";
import { Answer } from "./modules/answer/entities/answer.entity";

const config: Options = {
    driver: SqliteDriver,
    dbName: 'sqlite.db',
    entities: [User, Like, Question, Answer, Login, TimestampsEntity ],
    metadataProvider: TsMorphMetadataProvider,
    debug: true,
    extensions: [Migrator],
    migrations: {
        tableName: 'migrations', 
        path: process.cwd() + '/migrations', 
        transactional: true, 
        disableForeignKeys: true,
        emit: 'ts', 
      },
    entityRepository: ExtendedEntityRepository
};

export default config;