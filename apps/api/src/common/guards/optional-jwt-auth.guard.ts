import { Injectable } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<TUser = any>(err: any, user: any, info: any, context: any, status?: any): TUser {
    // Retorna o usuário autenticado caso presente, ou null caso anônimo (sem lançar 401)
    return (user || null) as TUser
  }
}

