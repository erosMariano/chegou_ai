export interface CondominiumAddress {
  id: string
  condominiumId: string
  label: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  addressAliases: string[]
  isPrimary: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateCondominiumAddressInput {
  label: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  addressAliases?: string[]
  isPrimary?: boolean
}

export type UpdateCondominiumAddressInput = Partial<CreateCondominiumAddressInput>

