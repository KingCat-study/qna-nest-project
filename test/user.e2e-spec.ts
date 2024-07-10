import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
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
		const em = orm.em.fork();
		await em.nativeDelete('User', {});
	});

	afterAll(async () => {
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
			.expect(201);

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
			.expect(201);

		const loginResponse = await request(app.getHttpServer())
			.post('/auth/login')
			.send({ email: 'testuser@example.com', password: 'Password123!' })
			.expect(200);

		const token = loginResponse.body.token;

		const response = await request(app.getHttpServer())
			.get('/user')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		expect(Array.isArray(response.body)).toBe(true);
		expect(response.body.length).toBeGreaterThan(0);
	});

	it('/user/:id (DELETE) should delete a user', async () => {
		const createUserDto: CreateUserDto = {
			name: 'Delete User',
			email: 'deleteuser@example.com',
			password: 'Password123!',
			role: UserRole.ADMIN,
		};

		const createResponse = await request(app.getHttpServer())
			.post('/user')
			.send(createUserDto)
			.expect(201);

		const userId = createResponse.body.id;

		const loginResponse = await request(app.getHttpServer())
			.post('/auth/login')
			.send({ email: createUserDto.email, password: createUserDto.password })
			.expect(200);

		const token = loginResponse.body.token;

		await request(app.getHttpServer())
			.delete(`/user/${userId}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
	});
});