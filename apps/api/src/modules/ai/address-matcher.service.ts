import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "@/prisma/prisma.service"

export interface ExtractedAddressInput {
  extractedStreet?: string | null
  extractedNumber?: string | null
  extractedZipCode?: string | null
  extractedCity?: string | null
}

export interface AddressValidationResult {
  isMatch: boolean | null
  matchedAddressLabel?: string
  mismatchReason?: string
}

@Injectable()
export class AddressMatcherService {
  private readonly logger = new Logger(AddressMatcherService.name)

  constructor(private readonly prisma: PrismaService) {}

  normalizeText(text?: string | null): string {
    if (!text) return ""
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^\w\s]/gi, " ") // pontuações viram espaço
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b(r|rua)\b/g, "rua")
      .replace(/\b(av|av\.|avenida)\b/g, "avenida")
      .replace(/\b(al|alameda)\b/g, "alameda")
      .replace(/\b(pc|pca|praca)\b/g, "praca")
      .replace(/\b(trav|tv|travessa)\b/g, "travessa")
      .replace(/\b(rod|rodovia)\b/g, "rodovia")
      .replace(/\b(est|estrada)\b/g, "estrada")
      .replace(/\s+/g, " ")
      .trim()
  }

  normalizeZip(zip?: string | null): string {
    if (!zip) return ""
    return zip.replace(/\D/g, "")
  }

  normalizeNumber(num?: string | null): string {
    if (!num) return ""
    // Extrai o primeiro grupo de dígitos ou string limpa
    const digits = num.replace(/\D/g, "")
    return digits || num.trim().toLowerCase()
  }

  async matchAddress(input: ExtractedAddressInput): Promise<AddressValidationResult> {
    const rawStreet = input.extractedStreet?.trim()
    const rawNumber = input.extractedNumber?.trim()
    const rawZip = input.extractedZipCode?.trim()
    const rawCity = input.extractedCity?.trim()

    // Se nenhum campo relevante foi extraído, considera ilegível/não presente
    if (!rawStreet && !rawNumber && !rawZip) {
      return {
        isMatch: null,
      }
    }

    const addresses = await this.prisma.condominiumAddress.findMany({
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })

    if (addresses.length === 0) {
      this.logger.warn("Nenhum endereço oficial cadastrado no condomínio. Ignorando validação.")
      return {
        isMatch: true,
        matchedAddressLabel: "Endereço Não Configurado",
      }
    }

    const normStreet = this.normalizeText(rawStreet)
    const normNumber = this.normalizeNumber(rawNumber)
    const normZip = this.normalizeZip(rawZip)

    for (const addr of addresses) {
      const addrZip = this.normalizeZip(addr.zipCode)
      const addrNumber = this.normalizeNumber(addr.number)
      const addrStreet = this.normalizeText(addr.street)

      const zipMatches = normZip.length >= 8 && addrZip.length >= 8 && normZip === addrZip
      const numberMatches = normNumber !== "" && addrNumber !== "" && normNumber === addrNumber

      // Verifica correspondência de rua no logradouro principal e nos aliases
      const allStreetVariations = [addrStreet, ...(addr.addressAliases || []).map((a) => this.normalizeText(a))]
      const streetMatches =
        normStreet !== "" &&
        allStreetVariations.some(
          (variant) =>
            variant === normStreet ||
            variant.includes(normStreet) ||
            normStreet.includes(variant)
        )

      // Regra de Match:
      // 1. CEP + Número conferem
      // 2. Rua + Número conferem
      // 3. CEP + Rua conferem
      // 4. Se só houver CEP legível e for idêntico
      const isConfirmed =
        (zipMatches && numberMatches) ||
        (streetMatches && numberMatches) ||
        (zipMatches && streetMatches) ||
        (zipMatches && !normNumber && !normStreet)

      if (isConfirmed) {
        return {
          isMatch: true,
          matchedAddressLabel: addr.label,
        }
      }
    }

    // Divergência detectada
    const parts: string[] = []
    if (rawStreet) parts.push(rawStreet)
    if (rawNumber) parts.push(`nº ${rawNumber}`)
    if (rawZip) parts.push(`CEP ${rawZip}`)
    if (rawCity) parts.push(rawCity)

    const labelDesc = parts.length > 0 ? parts.join(", ") : "dados divergentes"

    return {
      isMatch: false,
      mismatchReason: `Endereço divergente: etiqueta indica "${labelDesc}", que não corresponde a nenhum dos ${addresses.length} endereços oficiais do condomínio.`,
    }
  }
}

