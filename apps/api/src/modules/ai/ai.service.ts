import {
  Injectable,
  Logger,
  BadRequestException,
  UnprocessableEntityException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@/prisma/prisma.service"
import { AddressMatcherService, AddressValidationResult } from "./address-matcher.service"

export interface ExtractedLabelData {
  recipientName: string | null
  unitBlock: string | null
  unitNumber: string | null
  trackingCode: string | null
  carrier: string | null
  extractedStreet?: string | null
  extractedNumber?: string | null
  extractedZipCode?: string | null
  extractedCity?: string | null
  confidenceScore: number
  uncertaintyReason: string | null
}

export interface LabelExtractionResult {
  extracted: ExtractedLabelData
  matchedUnitId: string | null
  confidenceScore: number
  requiresReview: boolean
  processingTimeMs: number
  addressValidation: AddressValidationResult
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly addressMatcher: AddressMatcherService
  ) {}

  async extractLabelFromImage(imageBase64?: string, mimeType = "image/jpeg"): Promise<LabelExtractionResult> {
    const startTime = Date.now()
    const apiKey = this.config.get<string>("GEMINI_API_KEY")

    if (!imageBase64 || imageBase64.trim() === "") {
      throw new BadRequestException("Nenhuma imagem fornecida. Por favor, capture ou selecione uma foto da etiqueta.")
    }

    if (!apiKey || apiKey.trim() === "") {
      this.logger.error("GEMINI_API_KEY não configurada no servidor.")
      throw new BadRequestException("Serviço de IA indisponível: chave GEMINI_API_KEY não configurada no servidor.")
    }

    let extracted: ExtractedLabelData

    try {
      extracted = await this.callGeminiVision(imageBase64, mimeType, apiKey)
    } catch (err: any) {
      this.logger.error(`Falha ao processar etiqueta via Gemini: ${err.message}`)
      throw new UnprocessableEntityException(
        "Não foi possível ler a etiqueta. Por favor, aproxime a câmera e tire uma foto mais nítida e bem iluminada."
      )
    }

    // Se a IA não conseguiu extrair nenhum dado relevante da imagem (foto borrada, escura ou sem etiqueta legível)
    const hasAnyUsefulData = Boolean(
      (extracted.recipientName && extracted.recipientName.trim()) ||
      (extracted.unitNumber && extracted.unitNumber.trim()) ||
      (extracted.trackingCode && extracted.trackingCode.trim()) ||
      (extracted.extractedStreet && extracted.extractedStreet.trim()) ||
      (extracted.extractedZipCode && extracted.extractedZipCode.trim())
    )

    if (!hasAnyUsefulData) {
      this.logger.warn("A IA não conseguiu identificar dados legíveis da etiqueta na imagem.")
      throw new UnprocessableEntityException(
        "A etiqueta não pôde ser identificada na foto. Por favor, enquadre a etiqueta de perto em um ambiente bem iluminado e tente novamente."
      )
    }

    // Entity matching com o banco de unidades do PostgreSQL
    let matchedUnitId: string | null = null

    if (extracted.unitNumber) {
      const units = await this.prisma.unit.findMany({
        where: { isActive: true },
      })

      const targetBlock = (extracted.unitBlock || "").toUpperCase().replace(/BLOCO|TORRE/gi, "").trim()
      const targetNumber = extracted.unitNumber.trim()

      const found = units.find((u) => {
        const uBlock = u.block.toUpperCase().replace(/BLOCO|TORRE/gi, "").trim()
        const matchesNumber = u.number === targetNumber
        const matchesBlock = !targetBlock || uBlock === targetBlock || uBlock === "UNICO"
        return matchesNumber && matchesBlock
      })

      if (found) {
        matchedUnitId = found.id
      }
    }

    // Validação de endereço oficial do condomínio (Multi-Address Validation)
    const addressValidation = await this.addressMatcher.matchAddress({
      extractedStreet: extracted.extractedStreet,
      extractedNumber: extracted.extractedNumber,
      extractedZipCode: extracted.extractedZipCode,
      extractedCity: extracted.extractedCity,
    })

    // REGRA DE SEGURANÇA: Se a IA identificar que o endereço é diferente do condomínio (isMatch === false),
    // não deve preencher os dados da encomenda nem associar a qualquer unidade.
    if (addressValidation.isMatch === false) {
      this.logger.warn(
        `Endereço divergente detectado: ${addressValidation.mismatchReason}. Bloqueando preenchimento dos campos de dados da encomenda.`
      )
      matchedUnitId = null
      extracted = {
        ...extracted,
        recipientName: null,
        unitBlock: null,
        unitNumber: null,
        trackingCode: null,
        carrier: null,
        uncertaintyReason:
          addressValidation.mismatchReason || "Endereço não corresponde a nenhum dos endereços oficiais do condomínio.",
      }
    }

    const confidenceScore =
      typeof extracted.confidenceScore === "number" && !isNaN(extracted.confidenceScore)
        ? extracted.confidenceScore
        : 0.0
    const requiresReview =
      confidenceScore < 0.80 || !matchedUnitId || addressValidation.isMatch === false

    return {
      extracted,
      matchedUnitId,
      confidenceScore,
      requiresReview,
      processingTimeMs: Date.now() - startTime,
      addressValidation,
    }
  }

  private async callGeminiVision(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedLabelData> {
    let effectiveMime = mimeType || "image/jpeg"
    const match = base64Image.match(/^data:([^;]+);base64,/)
    if (match) {
      effectiveMime = match[1]
    }
    const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "")

    const prompt = `Você é um especialista em logística condominial e extração de dados de etiquetas de transporte.
Analise a imagem da etiqueta de encomenda fornecida e extraia exclusivamente os dados do DESTINATÁRIO final (morador e endereço de entrega no condomínio), ignorando os dados do remetente/loja.
Retorne um JSON estrito com os seguintes campos:
- recipientName (string ou null)
- unitBlock (string ou null, ex: 'A', 'B')
- unitNumber (string ou null, ex: '402', '101')
- trackingCode (string ou null)
- carrier (string ou null, ex: 'Mercado Livre', 'Amazon', 'Shopee', 'Correios')
- extractedStreet (string ou null, logradouro do destinatário, ex: 'Avenida das Américas', 'Rua X')
- extractedNumber (string ou null, número predial do condomínio, ex: '1500')
- extractedZipCode (string ou null, CEP do destinatário, ex: '22640-101' ou '22640101')
- extractedCity (string ou null, cidade do destinatário)
- confidenceScore (número entre 0.0 e 1.0)
- uncertaintyReason (string ou null se confidenceScore < 0.8)`

    const model = this.config.get<string>("AI_MODEL_VISION") || this.config.get<string>("GEMINI_MODEL") || "gemini-2.5-flash"
    this.logger.log(`Invocando Gemini Vision com o modelo: ${model}`)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: effectiveMime,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.1,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Google API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error("Resposta vazia da API do Gemini")
    }

    const cleanText = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim()
    return JSON.parse(cleanText)
  }
}

