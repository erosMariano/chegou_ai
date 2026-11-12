import { IsString, IsOptional, IsIn } from "class-validator"

export class ExtractLabelDto {
  @IsString()
  @IsOptional()
  image?: string

  @IsString()
  @IsOptional()
  @IsIn(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"], {
    message: "mimeType deve ser uma imagem suportada (jpeg, png, webp, heic, heif).",
  })
  mimeType?: string
}

