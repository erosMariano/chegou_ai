import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator"
import { UserRole } from "@prisma/client"

export class CreateUserDto {
  @IsString({ message: "Nome deve ser um texto" })
  @IsNotEmpty({ message: "Nome é obrigatório" })
  name!: string

  @IsEmail({}, { message: "E-mail inválido" })
  @IsNotEmpty({ message: "E-mail é obrigatório" })
  email!: string

  @IsString({ message: "Senha deve ser um texto" })
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  password!: string

  @IsEnum(UserRole, { message: "Perfil deve ser PORTER ou ADMIN" })
  @IsOptional()
  role?: UserRole
}

export class UpdateUserDto {
  @IsString({ message: "Nome deve ser um texto" })
  @IsOptional()
  name?: string

  @IsEmail({}, { message: "E-mail inválido" })
  @IsOptional()
  email?: string

  @IsString({ message: "Senha deve ser um texto" })
  @MinLength(6, { message: "Senha deve ter no mínimo 6 caracteres" })
  @IsOptional()
  password?: string

  @IsEnum(UserRole, { message: "Perfil deve ser PORTER ou ADMIN" })
  @IsOptional()
  role?: UserRole

  @IsOptional()
  isActive?: boolean
}

