import { UserRole } from "../entities/user-role.enum";

export class CreateUserResponseDto {
    name: string;
    email: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}