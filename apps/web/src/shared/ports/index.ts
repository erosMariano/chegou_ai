import { PackagePort } from "./package-port"
import { UnitPort } from "./unit-port"
import { IAuthGateway } from "./IAuthGateway"
import { HttpPackageAdapter } from "@/shared/adapters/http/http-package-adapter"
import { HttpUnitAdapter } from "@/shared/adapters/http/http-unit-adapter"
import { HttpAuthAdapter } from "@/shared/adapters/http/http-auth-adapter"
import { mockPackageAdapter } from "@/shared/adapters/mock/mock-package-adapter"
import { mockUnitAdapter } from "@/shared/adapters/mock/mock-unit-adapter"
import { localStorageAuthAdapter } from "@/shared/adapters/mock/local-storage-auth-adapter"

/**
 * Port Wiring (Arquitetura Hexagonal / Ports & Adapters)
 * Por padrão, o Chegou.AI agora conecta diretamente aos Adapters HTTP
 * para consumo da API NestJS Core (/api/v1).
 *
 * Mocks são ativados estritamente quando NEXT_PUBLIC_USE_MOCKS="true".
 */
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

export const packagePort: PackagePort = useMocks
  ? mockPackageAdapter
  : new HttpPackageAdapter()

export const unitPort: UnitPort = useMocks
  ? mockUnitAdapter
  : new HttpUnitAdapter()

export const authGateway: IAuthGateway = useMocks
  ? localStorageAuthAdapter
  : new HttpAuthAdapter()

export * from "./package-port"
export * from "./unit-port"
export * from "./IAuthGateway"
