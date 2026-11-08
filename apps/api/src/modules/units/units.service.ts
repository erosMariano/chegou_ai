import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeResidents = false) {
    return this.prisma.unit.findMany({
      where: { isActive: true },
      orderBy: [{ block: "asc" }, { number: "asc" }],
      include: includeResidents
        ? {
            residents: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isPrimary: true,
              },
            },
          }
        : undefined,
    })
  }

  async findOne(id: string, includeResidents = false) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: includeResidents
        ? {
            residents: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isPrimary: true,
              },
            },
          }
        : undefined,
    })

    if (!unit) {
      throw new NotFoundException(`Unidade com id ${id} não encontrada.`)
    }

    return unit
  }

  async create(data: { block?: string; number: string; isActive?: boolean }) {
    const block = (data.block || "UNICO").toUpperCase().trim()
    const number = data.number.trim()

    const existing = await this.prisma.unit.findFirst({
      where: { block, number },
    })

    if (existing) {
      throw new ConflictException(`A unidade ${block} - ${number} já está cadastrada.`)
    }

    return this.prisma.unit.create({
      data: {
        block,
        number,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    })
  }

  async update(id: string, data: { block?: string; number?: string; isActive?: boolean }) {
    await this.findOne(id)
    return this.prisma.unit.update({
      where: { id },
      data: {
        ...(data.block ? { block: data.block.toUpperCase().trim() } : {}),
        ...(data.number ? { number: data.number.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    })
  }

  async remove(id: string) {
    await this.findOne(id)

    const hasPackages = await this.prisma.package.count({ where: { unitId: id } })
    const hasResidents = await this.prisma.resident.count({ where: { unitId: id } })

    if (hasPackages > 0 || hasResidents > 0) {
      return this.prisma.unit.update({
        where: { id },
        data: { isActive: false },
      })
    }

    return this.prisma.unit.delete({
      where: { id },
    })
  }
}

