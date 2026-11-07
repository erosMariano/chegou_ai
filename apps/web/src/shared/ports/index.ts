import { PackagePort } from "./package-port"
import { UnitPort } from "./unit-port"
import { IAuthGateway } from "./IAuthGateway"
import { mockPackageAdapter } from "@/shared/adapters/mock/mock-package-adapter"
import { mockUnitAdapter } from "@/shared/adapters/mock/mock-unit-adapter"
import { localStorageAuthAdapter } from "@/shared/adapters/mock/local-storage-auth-adapter"

export const packagePort: PackagePort = mockPackageAdapter
export const unitPort: UnitPort = mockUnitAdapter
export const authGateway: IAuthGateway = localStorageAuthAdapter

export * from "./package-port"
export * from "./unit-port"
export * from "./IAuthGateway"
