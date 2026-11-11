import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateNested,
  Length,
} from "class-validator"
import { Type } from "class-transformer"
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

export class InitialCondominiumAddressDto {
  @ApiProperty({ example: "Portaria Principal", required: false, description: "Rótulo identificador do endereço" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string

  @ApiProperty({ example: "01410-000", description: "CEP oficial do condomínio" })
  @IsString({ message: "O CEP deve ser um texto." })
  @IsNotEmpty({ message: "O CEP do condomínio é obrigatório." })
  zipCode: string

  @ApiProperty({ example: "Avenida Paulista", description: "Logradouro oficial do condomínio" })
  @IsString({ message: "O logradouro deve ser um texto." })
  @IsNotEmpty({ message: "O logradouro do condomínio é obrigatório." })
  @MaxLength(200)
  street: string

  @ApiProperty({ example: "1500", description: "Número predial do condomínio" })
  @IsString({ message: "O número predial deve ser um texto." })
  @IsNotEmpty({ message: "O número predial é obrigatório." })
  @MaxLength(20)
  number: string

  @ApiProperty({ example: "Bela Vista", description: "Bairro do condomínio" })
  @IsString({ message: "O bairro deve ser um texto." })
  @IsNotEmpty({ message: "O bairro é obrigatório." })
  @MaxLength(100)
  neighborhood: string

  @ApiProperty({ example: "São Paulo", description: "Cidade do condomínio" })
  @IsString({ message: "A cidade deve ser um texto." })
  @IsNotEmpty({ message: "A cidade é obrigatória." })
  @MaxLength(100)
  city: string

  @ApiProperty({ example: "SP", description: "UF do condomínio (2 letras)" })
  @IsString({ message: "A UF deve ser um texto." })
  @Length(2, 2, { message: "A UF deve conter exatamente 2 letras (ex: SP, RJ)." })
  state: string
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

  @ApiProperty({ type: InitialCondominiumAddressDto, required: false, description: "Endereço oficial principal do condomínio" })
  @IsOptional()
  @ValidateNested()
  @Type(() => InitialCondominiumAddressDto)
  address?: InitialCondominiumAddressDto
}
