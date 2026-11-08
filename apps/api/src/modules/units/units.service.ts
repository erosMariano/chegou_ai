import { Injectable, ConflictException, NotFoundException } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.unit.findMany({
      where: { isActive: true },
      orderBy: [{ block: "asc" }, { number: "asc" }],
      include: {
        residents: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isPrimary: true,
          },
        },
      },
    })
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        residents: true,
      },
    })

    if (!unit) {
      throw new NotFoundException(`Unidade com id ${id} não encontrada.`)
    }

    return unit
  }

  async create(data: { block?: string; number: string }) {
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
        isActive: true,
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
}

