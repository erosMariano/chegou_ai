import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"
import { CreateCondominiumAddressDto, UpdateCondominiumAddressDto } from "./dto/condominium-address.dto"

@Injectable()
export class CondominiumService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCondominium() {
    let condo = await this.prisma.condominium.findFirst()
    if (!condo) {
      condo = await this.prisma.condominium.create({
        data: {
          name: "Condomínio Chegou.AI",
        },
      })
    }
    return condo
  }

  async listAddresses() {
    const condo = await this.getOrCreateCondominium()
    return this.prisma.condominiumAddress.findMany({
      where: { condominiumId: condo.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })
  }

  async getAddressById(id: string) {
    const address = await this.prisma.condominiumAddress.findUnique({
      where: { id },
    })
    if (!address) {
      throw new NotFoundException(`Endereço com ID ${id} não encontrado.`)
    }
    return address
  }

  async createAddress(data: CreateCondominiumAddressDto) {
    const condo = await this.getOrCreateCondominium()
    const zipCode = data.zipCode.replace(/\D/g, "")
    const state = data.state.toUpperCase().trim()

    // Se for o primeiro endereço ou marcado como isPrimary, desmarca outros
    const existingCount = await this.prisma.condominiumAddress.count({
      where: { condominiumId: condo.id },
    })

    const isPrimary = data.isPrimary ?? (existingCount === 0)

    if (isPrimary && existingCount > 0) {
      await this.prisma.condominiumAddress.updateMany({
        where: { condominiumId: condo.id },
        data: { isPrimary: false },
      })
    }

    return this.prisma.condominiumAddress.create({
      data: {
        condominiumId: condo.id,
        label: data.label.trim(),
        street: data.street.trim(),
        number: data.number.trim(),
        neighborhood: data.neighborhood.trim(),
        city: data.city.trim(),
        state,
        zipCode,
        addressAliases: data.addressAliases || [],
        isPrimary,
      },
    })
  }

  async updateAddress(id: string, data: UpdateCondominiumAddressDto) {
    const address = await this.getAddressById(id)

    const zipCode = data.zipCode !== undefined ? data.zipCode.replace(/\D/g, "") : undefined
    const state = data.state !== undefined ? data.state.toUpperCase().trim() : undefined

    if (data.isPrimary) {
      await this.prisma.condominiumAddress.updateMany({
        where: { condominiumId: address.condominiumId, id: { not: id } },
        data: { isPrimary: false },
      })
    }

    return this.prisma.condominiumAddress.update({
      where: { id },
      data: {
        ...(data.label !== undefined ? { label: data.label.trim() } : {}),
        ...(data.street !== undefined ? { street: data.street.trim() } : {}),
        ...(data.number !== undefined ? { number: data.number.trim() } : {}),
        ...(data.neighborhood !== undefined ? { neighborhood: data.neighborhood.trim() } : {}),
        ...(data.city !== undefined ? { city: data.city.trim() } : {}),
        ...(state !== undefined ? { state } : {}),
        ...(zipCode !== undefined ? { zipCode } : {}),
        ...(data.addressAliases !== undefined ? { addressAliases: data.addressAliases } : {}),
        ...(data.isPrimary !== undefined ? { isPrimary: data.isPrimary } : {}),
      },
    })
  }

  async deleteAddress(id: string) {
    const address = await this.getAddressById(id)

    // Regra Crítica de Domínio: O condomínio deve possuir no mínimo 1 endereço oficial cadastrado
    const totalCount = await this.prisma.condominiumAddress.count({
      where: { condominiumId: address.condominiumId },
    })

    if (totalCount <= 1) {
      throw new BadRequestException("O condomínio deve possuir no mínimo 1 endereço oficial cadastrado.")
    }

    await this.prisma.condominiumAddress.delete({
      where: { id },
    })

    // Se o endereço excluído era o primário, promove o próximo endereço mais antigo a primário
    if (address.isPrimary) {
      const nextAddress = await this.prisma.condominiumAddress.findFirst({
        where: { condominiumId: address.condominiumId },
        orderBy: { createdAt: "asc" },
      })
      if (nextAddress) {
        await this.prisma.condominiumAddress.update({
          where: { id: nextAddress.id },
          data: { isPrimary: true },
        })
      }
    }

    return { message: "Endereço removido com sucesso.", id }
  }
}

