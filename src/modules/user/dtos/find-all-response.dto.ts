import { UserRole } from "../entities/user-role.enum";

export class FindAllUsersResponseDto {
    id: string;
    name: string;
    email: string;
    role: UserRole; 
    createdAt: Date;
    updatedAt: Date;
  }