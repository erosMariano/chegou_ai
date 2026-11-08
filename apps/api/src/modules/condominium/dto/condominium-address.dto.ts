import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, Length } from "class-validator"

export class CreateCondominiumAddressDto {
  @IsString()
  @IsNotEmpty({ message: "O rótulo do endereço é obrigatório (ex: Portaria Principal)" })
  label: string

  @IsString()
  @IsNotEmpty({ message: "O logradouro é obrigatório" })
  street: string

  @IsString()
  @IsNotEmpty({ message: "O número é obrigatório" })
  number: string

  @IsString()
  @IsNotEmpty({ message: "O bairro é obrigatório" })
  neighborhood: string

  @IsString()
  @IsNotEmpty({ message: "A cidade é obrigatória" })
  city: string

  @IsString()
  @Length(2, 2, { message: "A UF deve conter 2 letras (ex: SP, RJ)" })
  state: string

  @IsString()
  @IsNotEmpty({ message: "O CEP é obrigatório" })
  zipCode: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addressAliases?: string[]

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

export class UpdateCondominiumAddressDto {
  @IsOptional()
  @IsString()
  label?: string

  @IsOptional()
  @IsString()
  street?: string

  @IsOptional()
  @IsString()
  number?: string

  @IsOptional()
  @IsString()
  neighborhood?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  @Length(2, 2, { message: "A UF deve conter 2 letras (ex: SP, RJ)" })
  state?: string

  @IsOptional()
  @IsString()
  zipCode?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addressAliases?: string[]

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

