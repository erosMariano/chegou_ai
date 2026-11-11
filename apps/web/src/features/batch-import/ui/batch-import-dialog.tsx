"use client"

import React, { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, RefreshCw } from "lucide-react"

interface ImportUnitRow {
  block?: string
  number: string
}

interface ImportResidentRow {
  block?: string
  number: string
  fullName: string
  email: string
  phone?: string
  isPrimary?: boolean
}

interface ParsedCsvRow {
  block: string
  number: string
  fullName?: string
  email?: string
  phone?: string
  isPrimary?: boolean
}

interface ImportResultSummary {
  totalReceived: number
  created: number
  skipped?: number
  residentsCreated?: number
  errors?: string[]
}

interface BatchImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "UNITS" | "RESIDENTS"
  onSuccess: () => void
  onImportUnits?: (items: ImportUnitRow[]) => Promise<{ totalReceived: number; created: number; skipped: number }>
  onImportResidents?: (items: ImportResidentRow[]) => Promise<{ totalReceived: number; created: number; errors: string[] }>
}

function detectCsvDelimiter(headerLine: string): "," | ";" {
  const semicolonCount = (headerLine.match(/;/g) || []).length
  const commaCount = (headerLine.match(/,/g) || []).length
  return semicolonCount > commaCount ? ";" : ","
}

function parseCsvLine(line: string, delimiter: "," | ";"): string[] {
  return line.split(delimiter).map((part) => part.replace(/^"|"$/g, "").trim())
}

function parsePrimaryFlag(value?: string): boolean {
  const normalized = (value || "").trim().toLowerCase()
  return normalized === "sim" || normalized === "s" || normalized === "true" || normalized === "1"
}

function parseBatchCsv(text: string, type: "UNITS" | "RESIDENTS"): ParsedCsvRow[] {
  const cleanedText = text.replace(/^\uFEFF/, "")
  const lines = cleanedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return []
  }

  const delimiter = detectCsvDelimiter(lines[0])
  const rows: ParsedCsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i], delimiter)
    const block = parts[0] || "UNICO"
    const number = parts[1] || ""

    if (type === "UNITS") {
      if (parts.length === 1 && parts[0]) {
        rows.push({ block: "UNICO", number: parts[0] })
        continue
      }

      if (!number) continue

      const fullName = parts[2] || ""
      const email = parts[3] || ""
      const phone = parts[4] || ""
      const isPrimary = parsePrimaryFlag(parts[5])

      rows.push({
        block,
        number,
        ...(fullName ? { fullName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(fullName || email ? { isPrimary } : {}),
      })
    } else if (parts.length >= 4 && number) {
      rows.push({
        block,
        number,
        fullName: parts[2] || "",
        email: parts[3] || "",
        phone: parts[4] || "",
        isPrimary: parsePrimaryFlag(parts[5]),
      })
    }
  }

  return rows
}

export function BatchImportDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
  onImportUnits,
  onImportResidents,
}: BatchImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResultSummary | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasResidentData = parsedRows.some((row) => Boolean(row.fullName || row.email))
  const showResidentColumns = type === "RESIDENTS" || hasResidentData

  function handleDownloadTemplate() {
    let csvContent = ""
    let filename = ""

    if (type === "UNITS") {
      csvContent =
        "bloco,numero,nome_completo,email,telefone,principal\n" +
        "A,101,João da Silva,joao@exemplo.com,(11) 91234-5678,sim\n" +
        "A,102,,,,\n" +
        "B,402,Mariana Costa Silva,mariana@exemplo.com,(11) 98765-4321,sim\n"
      filename = "modelo-unidades-chegou-ai.csv"
    } else {
      csvContent =
        "bloco,numero,nome_completo,email,telefone,principal\n" +
        "B,402,Mariana Costa Silva,mariana@exemplo.com,(11) 98765-4321,sim\n" +
        "A,101,João da Silva,joao@exemplo.com,(11) 91234-5678,nao\n"
      filename = "modelo-moradores-chegou-ai.csv"
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function parseCSV(text: string) {
    const cleanedLines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (cleanedLines.length < 2) {
      toast.error("O arquivo precisa conter pelo menos o cabeçalho e uma linha de dados.")
      return
    }

    setParsedRows(parseBatchCsv(text, type))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      if (text) {
        parseCSV(text)
      }
    }
    reader.readAsText(selected, "UTF-8")
    e.target.value = ""
  }

  async function handleConfirmImport() {
    if (parsedRows.length === 0) {
      toast.error("Nenhuma linha identificada para importar.")
      return
    }

    try {
      setIsProcessing(true)
      if (type === "UNITS" && onImportUnits) {
        const unitRows: ImportUnitRow[] = parsedRows.map(({ block, number }) => ({ block, number }))
        const unitRes = await onImportUnits(unitRows)

        const residentRows: ImportResidentRow[] = []
        const validationErrors: string[] = []

        parsedRows.forEach((row, index) => {
          const fullName = (row.fullName || "").trim()
          const email = (row.email || "").trim()

          if (fullName && email) {
            residentRows.push({
              block: row.block,
              number: row.number,
              fullName,
              email,
              phone: row.phone,
              isPrimary: row.isPrimary,
            })
          } else if (fullName || email) {
            validationErrors.push(
              `Linha ${index + 1} (${row.block}-${row.number}): informe nome completo e e-mail para vincular o morador.`
            )
          }
        })

        let residentsCreated: number | undefined
        let residentErrors: string[] = []

        if (residentRows.length > 0 && onImportResidents) {
          const resResult = await onImportResidents(residentRows)
          residentsCreated = resResult.created
          residentErrors = resResult.errors
        }

        const allErrors = [...validationErrors, ...residentErrors]
        setImportResult({
          totalReceived: unitRes.totalReceived,
          created: unitRes.created,
          skipped: unitRes.skipped,
          residentsCreated,
          errors: allErrors,
        })

        if (residentsCreated !== undefined) {
          toast.success(
            `Importação concluída: ${unitRes.created} unidades e ${residentsCreated} moradores cadastrados!`
          )
        } else {
          toast.success(`Importação concluída: ${unitRes.created} unidades criadas!`)
        }
      } else if (type === "RESIDENTS" && onImportResidents) {
        const residentRows: ImportResidentRow[] = parsedRows.map((row) => ({
          block: row.block,
          number: row.number,
          fullName: row.fullName || "",
          email: row.email || "",
          phone: row.phone,
          isPrimary: row.isPrimary,
        }))
        const res = await onImportResidents(residentRows)
        setImportResult(res)
        toast.success(`Importação concluída: ${res.created} moradores cadastrados!`)
      }
      onSuccess()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao importar planilha"
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  function handleReset() {
    setFile(null)
    setParsedRows([])
    setImportResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[24px] border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <FileSpreadsheet className="size-5 text-[#E1FF01]" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="rounded-full text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            >
              <Download className="size-3.5 mr-1 text-zinc-500" />
              Baixar Modelo CSV
            </Button>
          </div>
          <DialogTitle className="text-lg font-extrabold text-zinc-950 tracking-tight">
            Importar {type === "UNITS" ? "Unidades e Moradores" : "Moradores"} em Lote
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {type === "UNITS"
              ? "Carregue uma planilha CSV com bloco e número da unidade e, opcionalmente, os dados do morador para vincular tudo de uma vez."
              : "Carregue uma planilha CSV para cadastrar dezenas ou centenas de condôminos instantaneamente."}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Dropzone */}
        {!file ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 hover:border-zinc-900 rounded-[20px] bg-zinc-50/50 hover:bg-white cursor-pointer transition-all group"
          >
            <div className="size-12 rounded-xl bg-zinc-100 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center mb-2 transition-colors">
              <Upload className="size-5 text-zinc-600 group-hover:text-[#E1FF01]" />
            </div>
            <p className="text-xs font-bold text-zinc-800">
              Clique para selecionar o arquivo CSV
            </p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Formato esperado: .csv delimitado por vírgulas (,) ou ponto-e-vírgula (;)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="size-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-zinc-900">{file.name}</p>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {parsedRows.length} linhas de dados identificadas
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-zinc-500 hover:text-zinc-900"
              >
                <RefreshCw className="size-3 mr-1" /> Trocar
              </Button>
            </div>

            {/* Preview das Primeiras Linhas */}
            {parsedRows.length > 0 && !importResult && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Pré-visualização (primeiras 5 linhas)
                </span>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-200 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 text-[10px] text-zinc-400 uppercase tracking-wider sticky top-0">
                      <tr className="border-b border-zinc-200">
                        <th className="py-2 px-3">Bloco</th>
                        <th className="py-2 px-3">Número</th>
                        {showResidentColumns && (
                          <>
                            <th className="py-2 px-3">Nome</th>
                            <th className="py-2 px-3">E-mail</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                      {parsedRows.slice(0, 5).map((r, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50">
                          <td className="py-2 px-3 font-semibold text-zinc-800">{r.block}</td>
                          <td className="py-2 px-3 text-zinc-700">{r.number}</td>
                          {showResidentColumns && (
                            <>
                              <td className="py-2 px-3 font-sans text-zinc-900 font-medium">
                                {r.fullName || "—"}
                              </td>
                              <td className="py-2 px-3 text-zinc-500">{r.email || "—"}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resultado da Carga */}
            {importResult && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Importação processada com sucesso!
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 font-semibold text-emerald-800">
                  <div>Recebidas: {importResult.totalReceived}</div>
                  <div>
                    {type === "UNITS" ? "Unidades" : "Cadastrados"}: {importResult.created}
                  </div>
                  {importResult.skipped !== undefined && (
                    <div>Já existiam: {importResult.skipped}</div>
                  )}
                  {importResult.residentsCreated !== undefined && (
                    <div>Moradores: {importResult.residentsCreated}</div>
                  )}
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="pt-2 text-[11px] text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="size-3.5 shrink-0" />
                      Avisos ({importResult.errors.length}):
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {importResult.errors.slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-zinc-200 text-xs flex-1"
          >
            {importResult ? "Fechar" : "Cancelar"}
          </Button>

          {!importResult && (
            <Button
              type="button"
              disabled={isProcessing || parsedRows.length === 0}
              onClick={handleConfirmImport}
              className="rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold px-6 flex-1 shadow-xs"
            >
              {isProcessing ? "Importando..." : `Confirmar Carga (${parsedRows.length})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
