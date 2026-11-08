import { IsString, IsOptional, IsBoolean, MinLength } from "class-validator"

export class CreateUnitDto {
  @IsOptional()
  @IsString()
  block?: string

  @IsString()
  @MinLength(1, { message: "Número do apartamento é obrigatório" })
  number: string
}

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  block?: string

  @IsOptional()
  @IsString()
  number?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

