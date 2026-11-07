"use client"

import React from "react"
import { isMockUiEnabled } from "./config"
import { Sparkles, AlertTriangle, HelpCircle } from "lucide-react"

export type AiScenarioType = "HIGH_CONFIDENCE" | "LOW_CONFIDENCE" | "MANUAL_FALLBACK"

interface MockAiScenarioBarProps {
  currentScenario?: AiScenarioType
  onSelectScenario: (scenario: AiScenarioType) => void
}

export function MockAiScenarioBar({
  currentScenario = "HIGH_CONFIDENCE",
  onSelectScenario,
}: MockAiScenarioBarProps) {
  if (!isMockUiEnabled()) return null

  const scenarios: {
    id: AiScenarioType
    label: string
    sublabel: string
    icon: React.ComponentType<{ className?: string }>
    badgeColor: string
  }[] = [
    {
      id: "HIGH_CONFIDENCE",
      label: "Alta Confiança (95%)",
      sublabel: "Mercado Livre • Bloco B 402",
      icon: Sparkles,
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      id: "LOW_CONFIDENCE",
      label: "Baixa Confiança (68%)",
      sublabel: "Etiqueta amassada • Requer revisão",
      icon: AlertTriangle,
      badgeColor: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      id: "MANUAL_FALLBACK",
      label: "Fallback Manual",
      sublabel: "Ilegível • Digitação manual",
      icon: HelpCircle,
      badgeColor: "text-zinc-700 bg-zinc-100 border-zinc-200",
    },
  ]

  return (
    <div className="space-y-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold uppercase tracking-wider text-zinc-500 text-[10px] flex items-center gap-1">
          <Sparkles className="size-3 text-[#E1FF01] fill-zinc-900" />
          Simulação de Resposta IA (Gemini 2.5)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {scenarios.map((sc) => {
          const Icon = sc.icon
          const isSelected = currentScenario === sc.id

          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(sc.id)}
              className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                isSelected
                  ? "bg-white border-zinc-900 shadow-2xs font-semibold"
                  : "bg-white/60 border-zinc-200/80 hover:bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="size-3.5 text-zinc-700 shrink-0" />
                <div>
                  <p className="text-xs text-zinc-900">{sc.label}</p>
                  <p className="text-[10px] text-zinc-400 font-normal">{sc.sublabel}</p>
                </div>
              </div>
              {isSelected && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-lg bg-zinc-900 text-[#E1FF01]">
                  Ativo
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

