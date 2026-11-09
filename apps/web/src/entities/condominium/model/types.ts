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

export interface CondominiumProfile {
  id: string
  name: string
  cnpj?: string | null
  addressStreet?: string | null
  addressNumber?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  conciergePhone?: string | null
}

export type UpdateCondominiumProfileInput = Partial<Omit<CondominiumProfile, "id">>

