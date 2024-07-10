import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserRole } from "../entities/user-role.enum";

export class CreateUserDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsEmail()
	@IsNotEmpty()
	email: string;

	@MinLength(8)
	@IsNotEmpty()
	password: string;

	@IsString()
	role: UserRole = UserRole.USER;

}