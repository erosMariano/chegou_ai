import { IsString, IsOptional } from "class-validator"

export class ExtractLabelDto {
  @IsString()
  @IsOptional()
  image?: string

  @IsString()
  @IsOptional()
  mimeType?: string
}

