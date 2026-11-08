import { IsEmail, IsString, IsOptional, MinLength } from "class-validator"

export class LoginDto {
  @IsEmail({}, { message: "Formato de e-mail inválido" })
  email: string

  @IsString()
  @IsOptional()
  @MinLength(6, { message: "Senha deve possuir no mínimo 6 caracteres" })
  password?: string
}

