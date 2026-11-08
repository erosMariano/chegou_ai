import { IsEmail, IsString, IsNotEmpty, MinLength } from "class-validator"

export class LoginDto {
  @IsEmail({}, { message: "Formato de e-mail inválido" })
  email: string

  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve possuir no mínimo 6 caracteres" })
  password: string
}

