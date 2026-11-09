import { IsString, IsOptional, MaxLength } from "class-validator"

export class UpdateCondominiumProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(150, { message: "O nome do condomínio deve ter no máximo 150 caracteres." })
  name?: string

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: "O CNPJ deve ter no máximo 30 caracteres." })
  cnpj?: string

  @IsString()
  @IsOptional()
  @MaxLength(30, { message: "O telefone da portaria deve ter no máximo 30 caracteres." })
  conciergePhone?: string

  @IsString()
  @IsOptional()
  @MaxLength(200)
  addressStreet?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  addressNumber?: string

  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string

  @IsString()
  @IsOptional()
  @MaxLength(2)
  state?: string

  @IsString()
  @IsOptional()
  @MaxLength(20)
  zipCode?: string
}
