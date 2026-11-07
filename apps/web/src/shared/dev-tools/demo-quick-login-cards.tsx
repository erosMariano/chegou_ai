"use client"

import React from "react"
import { isMockUiEnabled } from "./config"
import { UserRole } from "@/shared/ports/IAuthGateway"
import { Shield, User, ShieldCheck, ArrowRight, Zap } from "lucide-react"

interface DemoQuickLoginCardsProps {
  onSelectRole: (role: UserRole) => void
  disabled?: boolean
}

export function DemoQuickLoginCards({ onSelectRole, disabled }: DemoQuickLoginCardsProps) {
  if (!isMockUiEnabled()) return null

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
          <Zap className="size-3.5 text-zinc-900 fill-zinc-900" />
          Acesso Rápido Demo (1 Toque)
        </span>
        <span className="text-[11px] font-medium text-zinc-500">Sem senha</span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {/* Porteiro Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectRole("PORTER")}
          className="w-full flex items-center justify-between p-3.5 rounded-lg bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Shield className="size-5 text-[#E1FF01]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">Carlos Silva</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200">
                  Porteiro
                </span>
              </div>
              <p className="text-xs text-zinc-500">Check-in IA, busca &amp; baixa de pacotes</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Moradora Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectRole("RESIDENT")}
          className="w-full flex items-center justify-between p-3.5 rounded-lg bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <User className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">Mariana Costa</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Bloco B &bull; 402
                </span>
              </div>
              <p className="text-xs text-zinc-500">Passe digital, QR Code &amp; Web Push</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>

        {/* Sindico Card */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectRole("ADMIN")}
          className="w-full flex items-center justify-between p-3.5 rounded-lg bg-white border border-zinc-200/90 shadow-2xs hover:border-zinc-400 hover:shadow-xs transition-all text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">Roberto Almeida</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  Síndico
                </span>
              </div>
              <p className="text-xs text-zinc-500">Auditoria imutável &amp; governança</p>
            </div>
          </div>
          <ArrowRight className="size-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      </div>
    </div>
  )
}

