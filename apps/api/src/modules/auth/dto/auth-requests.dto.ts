import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"

export class ActivateAccountDto {
  @IsEmail({}, { message: "Informe um e-mail válido para ativação da conta." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string

  @IsString({ message: "Token de ativação inválido." })
  @IsNotEmpty({ message: "O token de ativação é obrigatório." })
  token: string

  @IsString({ message: "A senha deve ser uma cadeia de caracteres." })
  @MinLength(6, { message: "A nova senha deve ter no mínimo 6 caracteres." })
  password: string
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Informe um e-mail válido para recuperação." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string
}

export class ResetPasswordDto {
  @IsEmail({}, { message: "Informe um e-mail válido." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string

  @IsString({ message: "Token de validação inválido." })
  @IsNotEmpty({ message: "O token de redefinição é obrigatório." })
  token: string

  @IsString({ message: "A nova senha deve ser uma cadeia de caracteres." })
  @MinLength(6, { message: "A nova senha deve ter no mínimo 6 caracteres." })
  newPassword: string
}
