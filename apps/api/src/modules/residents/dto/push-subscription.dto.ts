import { IsUrl, IsNotEmpty, IsString, ValidateNested, IsOptional } from "class-validator"
import { Type } from "class-transformer"

export class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty({ message: "Chave p256dh é obrigatória" })
  p256dh: string

  @IsString()
  @IsNotEmpty({ message: "Chave auth é obrigatória" })
  auth: string
}

export class RegisterPushSubscriptionDto {
  @IsUrl(
    { protocols: ["https"], require_tld: true, require_protocol: true },
    { message: "O endpoint de WebPush deve ser uma URL HTTPS pública válida" }
  )
  @IsNotEmpty({ message: "Endpoint de push é obrigatório" })
  endpoint: string

  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto

  @IsOptional()
  @IsString()
  userAgent?: string
}
