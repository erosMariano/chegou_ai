import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  IsIn,
  Min,
  Max,
} from "class-validator"

export class CreatePackageDto {
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId: string

  @IsString()
  @MinLength(2, { message: "Nome do destinatário deve possuir no mínimo 2 caracteres" })
  recipientNameRaw: string

  @IsOptional()
  @IsString()
  trackingCode?: string

  @IsOptional()
  @IsString()
  carrier?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidenceScore?: number
}

export class CheckoutPackageDto {
  @IsString()
  @MinLength(6, { message: "Código de retirada deve possuir no mínimo 6 dígitos" })
  code: string

  @IsIn(["PIN", "QR"], { message: "Tipo de código deve ser 'PIN' ou 'QR'" })
  codeType: "PIN" | "QR"

  @IsOptional()
  @IsUUID("4", { message: "ID da encomenda deve ser um UUID válido" })
  packageId?: string

  @IsOptional()
  @IsUUID("4", { message: "ID do morador deve ser um UUID válido" })
  residentId?: string

  @IsOptional()
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId?: string
}

