import { IsUUID, IsString, IsEmail, IsOptional, IsBoolean, MinLength } from "class-validator"

export class CreateResidentDto {
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId: string

  @IsString()
  @MinLength(2, { message: "Nome do morador deve ter pelo menos 2 caracteres" })
  fullName: string

  @IsEmail({}, { message: "Formato de e-mail inválido" })
  email: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  documentLast4?: string

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

export class UpdateResidentDto {
  @IsOptional()
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId?: string

  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Nome do morador deve ter pelo menos 2 caracteres" })
  fullName?: string

  @IsOptional()
  @IsEmail({}, { message: "Formato de e-mail inválido" })
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  documentLast4?: string

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

