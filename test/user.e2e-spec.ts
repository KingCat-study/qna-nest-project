import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateUserDto } from '../src/modules/user/dtos/create-request.dto';
import { UserRole } from '../src/modules/user/entities/user-role.enum';
import { MikroORM } from '@mikro-orm/sqlite';

describe('UserController (e2e)', () => {
    let app: INestApplication;
    let orm: MikroORM;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        orm = moduleFixture.get<MikroORM>(MikroORM);
    });

    beforeEach(async () => {
        const generator = orm.getSchemaGenerator();
        await generator.clearDatabase();
    });

    afterAll(async () => {
        const generator = orm.getSchemaGenerator();
        await generator.clearDatabase();

        await app.close();
    });

    it('/user (POST) should create a new user', async () => {
        const createUserDto: CreateUserDto = {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'Password123!',
            role: UserRole.USER,
        };

        const response = await request(app.getHttpServer())
            .post('/user')
            .send(createUserDto)
            .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('name', createUserDto.name);
        expect(response.body).toHaveProperty('email', createUserDto.email);
        expect(response.body).toHaveProperty('role', createUserDto.role);
    });

    it('/user (GET) should return all users', async () => {

        const createUserDto: CreateUserDto = {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'Password123!',
            role: UserRole.ADMIN,
        };

        await request(app.getHttpServer())
            .post('/user')
            .send(createUserDto)
            .expect(HttpStatus.CREATED);

        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'testuser@example.com', password: 'Password123!' })
            .expect(HttpStatus.OK);

        const token = loginResponse.headers.authorization;

        const response = await request(app.getHttpServer())
            .get('/user')
            .set('Authorization', `${token}`)
            .expect(HttpStatus.OK);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('/user/:id (DELETE) should delete a user', async () => {
        const deleteUser: CreateUserDto = {
            name: 'Delete User',
            email: 'deleteuser@example.com',
            password: 'Password123!',
            role: UserRole.ADMIN,
        };

        const createUser: CreateUserDto = {
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'Password123!',
            role: UserRole.ADMIN,
        };

        await request(app.getHttpServer())
            .post('/user')
            .send(deleteUser)
            .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
            .post('/user')
            .send(createUser)
            .expect(HttpStatus.CREATED);

        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: createUser.email, password: createUser.password })
            .expect(HttpStatus.OK);

        const token = loginResponse.headers.authorization;

        const response = await request(app.getHttpServer())
            .get('/user?email=' + deleteUser.email)
            .set('Authorization', `${token}`)
            .expect(HttpStatus.OK);

        const responseData = response.body;

        const id = responseData[0].id;

        console.log("should delete a user id", id);

        await request(app.getHttpServer())
            .delete(`/user/${id}`)
            .set('Authorization', `${token}`)
            .expect(HttpStatus.OK);

    });
});