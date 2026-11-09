import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class ActivateAccountDto {
  @ApiProperty({ example: "mariana.costa@email.com", description: "E-mail do morador cadastrado pelo condomínio" })
  @IsEmail({}, { message: "Informe um e-mail válido para ativação da conta." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string

  @ApiProperty({ example: "c6a1e3b5f9024c...", description: "Token criptográfico único recebido no convite" })
  @IsString({ message: "Token de ativação inválido." })
  @IsNotEmpty({ message: "O token de ativação é obrigatório." })
  token: string

  @ApiProperty({ example: "NovaSenha@2026", description: "Nova senha criada pelo morador (mínimo 6 caracteres)" })
  @IsString({ message: "A senha deve ser uma cadeia de caracteres." })
  @MinLength(6, { message: "A nova senha deve ter no mínimo 6 caracteres." })
  password: string
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "sindico@chegou.ai", description: "E-mail para envio das instruções de redefinição" })
  @IsEmail({}, { message: "Informe um e-mail válido para recuperação." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string
}

export class ResetPasswordDto {
  @ApiProperty({ example: "sindico@chegou.ai", description: "E-mail cadastrado" })
  @IsEmail({}, { message: "Informe um e-mail válido." })
  @IsNotEmpty({ message: "O e-mail é obrigatório." })
  email: string

  @ApiProperty({ example: "a7b3c9...", description: "Token de validação recebido por e-mail" })
  @IsString({ message: "Token de validação inválido." })
  @IsNotEmpty({ message: "O token de redefinição é obrigatório." })
  token: string

  @ApiProperty({ example: "MinhaNovaSenha@2026", description: "Nova senha de acesso (mínimo 6 caracteres)" })
  @IsString({ message: "A nova senha deve ser uma cadeia de caracteres." })
  @MinLength(6, { message: "A nova senha deve ter no mínimo 6 caracteres." })
  newPassword: string
}

export class SetupInitialAdminDto {
  @ApiProperty({ example: "Condomínio Residencial Jardins do Sol", description: "Nome institucional do condomínio" })
  @IsString({ message: "Nome do condomínio deve ser um texto." })
  @IsNotEmpty({ message: "Nome do condomínio é obrigatório." })
  @MaxLength(150, { message: "Nome do condomínio deve ter no máximo 150 caracteres." })
  condominiumName: string

  @ApiProperty({ example: "12.345.678/0001-90", required: false, description: "CNPJ do condomínio" })
  @IsOptional()
  @IsString()
  @MaxLength(18, { message: "CNPJ deve ter no máximo 18 caracteres." })
  cnpj?: string

  @ApiProperty({ example: "Roberto Almeida (Síndico)", description: "Nome completo do primeiro administrador" })
  @IsString({ message: "Nome do síndico/administrador é obrigatório." })
  @IsNotEmpty({ message: "Nome do síndico/administrador é obrigatório." })
  @MaxLength(150, { message: "Nome do administrador deve ter no máximo 150 caracteres." })
  name: string

  @ApiProperty({ example: "sindico@chegou.ai", description: "E-mail de acesso do síndico" })
  @IsEmail({}, { message: "Informe um e-mail válido para o síndico." })
  @IsNotEmpty({ message: "E-mail do síndico é obrigatório." })
  @MaxLength(150, { message: "E-mail deve ter no máximo 150 caracteres." })
  email: string

  @ApiProperty({ example: "SenhaSegura@123", description: "Senha mestra do síndico (mínimo 6 caracteres)" })
  @IsString({ message: "A senha deve ser uma cadeia de caracteres." })
  @MinLength(6, { message: "A senha deve ter no mínimo 6 caracteres." })
  @MaxLength(100, { message: "A senha deve ter no máximo 100 caracteres." })
  password: string
}
