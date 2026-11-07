import { PackagePort } from "./package-port"
import { UnitPort } from "./unit-port"
import { mockPackageAdapter } from "@/shared/adapters/mock/mock-package-adapter"
import { mockUnitAdapter } from "@/shared/adapters/mock/mock-unit-adapter"

export const packagePort: PackagePort = mockPackageAdapter
export const unitPort: UnitPort = mockUnitAdapter

export * from "./package-port"
export * from "./unit-port"

