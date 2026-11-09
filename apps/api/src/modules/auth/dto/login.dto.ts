import { IsEmail, IsString, IsNotEmpty, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class LoginDto {
  @ApiProperty({ example: "sindico@chegou.ai", description: "E-mail cadastrado do usuário" })
  @IsEmail({}, { message: "Formato de e-mail inválido" })
  email: string

  @ApiProperty({ example: "123456", description: "Senha de acesso (mínimo 6 caracteres)" })
  @IsString({ message: "Senha deve ser uma string" })
  @IsNotEmpty({ message: "Senha é obrigatória" })
  @MinLength(6, { message: "Senha deve possuir no mínimo 6 caracteres" })
  password: string
}

