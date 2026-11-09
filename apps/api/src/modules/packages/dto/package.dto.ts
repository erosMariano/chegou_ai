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
import { ApiProperty } from "@nestjs/swagger"

export class CreatePackageDto {
  @ApiProperty({ example: "d8f1e2c3-4b5a-6c7d-8e9f-0a1b2c3d4e5f", description: "ID UUID da unidade (bloco e número) do destinatário" })
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId: string

  @ApiProperty({ example: "Mariana Costa Silva", description: "Nome do destinatário impresso na etiqueta da encomenda" })
  @IsString()
  @MinLength(2, { message: "Nome do destinatário deve possuir no mínimo 2 caracteres" })
  recipientNameRaw: string

  @ApiProperty({ example: "BR123456789ML", required: false, description: "Código de rastreamento da transportadora" })
  @IsOptional()
  @IsString()
  trackingCode?: string

  @ApiProperty({ example: "Mercado Livre", required: false, description: "Nome da transportadora ou loja (Amazon, Correios, Shopee, etc.)" })
  @IsOptional()
  @IsString()
  carrier?: string

  @ApiProperty({ example: 0.95, required: false, description: "Score de confiança do modelo OCR de IA (entre 0.0 e 1.0)" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidenceScore?: number
}

export class CheckoutPackageDto {
  @ApiProperty({ example: "839201", description: "PIN numérico de 6 dígitos ou UUID do QR Code apresentado pelo morador" })
  @IsString()
  @MinLength(6, { message: "Código de retirada deve possuir no mínimo 6 dígitos" })
  code: string

  @ApiProperty({ enum: ["PIN", "QR"], example: "PIN", description: "Tipo do código de validação utilizado na baixa" })
  @IsIn(["PIN", "QR"], { message: "Tipo de código deve ser 'PIN' ou 'QR'" })
  codeType: "PIN" | "QR"

  @ApiProperty({ example: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d", required: false, description: "ID UUID da encomenda (recomendado para otimização de busca O(1))" })
  @IsOptional()
  @IsUUID("4", { message: "ID da encomenda deve ser um UUID válido" })
  packageId?: string

  @ApiProperty({ example: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e", required: false, description: "ID UUID do morador que retirou o pacote na portaria" })
  @IsOptional()
  @IsUUID("4", { message: "ID do morador deve ser um UUID válido" })
  residentId?: string

  @ApiProperty({ example: "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f", required: false, description: "ID UUID da unidade caso a busca seja escopada por apartamento" })
  @IsOptional()
  @IsUUID("4", { message: "ID da unidade deve ser um UUID válido" })
  unitId?: string
}

