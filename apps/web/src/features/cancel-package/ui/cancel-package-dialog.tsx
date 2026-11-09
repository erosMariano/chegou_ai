"use client"

import React, { useState } from "react"
import { PackageItem } from "@/entities/package/model/types"
import { packagePort } from "@/shared/ports"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { toast } from "sonner"
import { Ban, AlertTriangle, ArrowRight } from "lucide-react"

interface CancelPackageDialogProps {
  packageItem: PackageItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (updated: PackageItem) => void
}

export function CancelPackageDialog({
  packageItem,
  open,
  onOpenChange,
  onSuccess,
}: CancelPackageDialogProps) {
  const [reason, setReason] = useState("CARRIER_RETURN")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!packageItem) return null

  async function handleConfirm() {
    if (!packageItem) return
    try {
      setIsSubmitting(true)
      const updated = await packagePort.cancelPackage(packageItem.id, reason, notes)
      toast.success("Encomenda cancelada/devolvida com sucesso!", {
        description: `PIN e QR Token foram invalidados e a ação foi registrada na auditoria.`,
      })
      onSuccess(updated)
      onOpenChange(false)
      setNotes("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao cancelar encomenda"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[24px] border border-zinc-200 bg-white p-6 shadow-xl space-y-4">
        <DialogHeader className="space-y-1.5">
          <div className="size-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Ban className="size-5" />
          </div>
          <DialogTitle className="text-lg font-extrabold text-zinc-950 tracking-tight">
            Cancelar / Devolver Encomenda
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Pacote para {packageItem.recipientNameRaw} (Bl. {packageItem.unit?.block} - Apto {packageItem.unit?.number}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-700">Motivo do Cancelamento *</Label>
            <Select value={reason} onValueChange={(val) => setReason(val ?? "CARRIER_RETURN")}>
              <SelectTrigger className="h-10 rounded-xl border-zinc-200 bg-zinc-50/50 text-xs font-bold text-zinc-800">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="CARRIER_RETURN">
                  Devolvido à Transportadora (entregador levou de volta)
                </SelectItem>
                <SelectItem value="DAMAGED">
                  Pacote Danificado / Avariado
                </SelectItem>
                <SelectItem value="WRONG_UNIT">
                  Cadastrado por engano na unidade errada
                </SelectItem>
                <SelectItem value="REJECTED_BY_RESIDENT">
                  Recusado pelo Morador
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-bold text-zinc-700">
              Observações Adicionais (opcional)
            </Label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Entregador da van recolheu às 16h pois caixa estava rasgada..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-2.5 text-xs text-zinc-900 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900"
            />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="text-[11px] leading-relaxed">
              O PIN e o QR Code de retirada serão permanentemente invalidados e essa alteração constará no histórico de auditoria do condomínio.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-full border-zinc-200 text-xs flex-1"
          >
            Voltar
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 flex-1 shadow-xs"
          >
            {isSubmitting ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
