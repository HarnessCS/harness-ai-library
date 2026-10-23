'use client'

import { Copy, Check, ExternalLink, Cpu, Wrench, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Prompt, AGENT_LABELS, AVAILABILITY_LABELS,
  COMPLEXITY_LABELS, SDLC_STAGE_LABELS,
  PERSONA_LABELS,
} from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PromptCardProps {
  prompt: Prompt
  onClick: (prompt: Prompt) => void
}

const MODE_CONFIG = {
  standard: { label: 'Standard', icon: Cpu },
  architect: { label: 'Architect Mode', icon: Wrench },
  mcp: { label: 'MCP', icon: Zap },
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopied(true)
      toast.success('Prompt copied!', { description: prompt.title })
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'copy', promptId: prompt.id, moduleId: prompt.moduleId }),
      }).catch(() => {})
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const handleTry = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.content)
      toast.success('Prompt copied — paste into Harness AI', {
        action: {
          label: 'Open Harness AI',
          onClick: () => window.open('https://app.harness.io', '_blank'),
        },
      })
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'copy', promptId: prompt.id, moduleId: prompt.moduleId }),
      }).catch(() => {})
    } catch {
      toast.error('Failed to copy')
    }
  }

  const modeConfig = MODE_CONFIG[prompt.mode]
  const ModeIcon = modeConfig.icon
  const isUnavailable = prompt.availability === 'q3' || prompt.availability === 'q4'

  const shownPersonas = prompt.personas.slice(0, 2)
  const extraPersonas = prompt.personas.length - 2

  return (
    <div
      onClick={() => onClick(prompt)}
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 cursor-pointer transition-all duration-150',
        'hover:border-[#202020]/20 hover:shadow-md hover:-translate-y-0.5',
        isUnavailable && 'opacity-75'
      )}
    >
      {/* Header: module badge + availability + action buttons */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#5a5a62]">
            {prompt.moduleTitle}
          </span>
          {prompt.availability !== 'ga' && (
            <span className="text-[10px] font-medium text-[#5a5a62]">
              {AVAILABILITY_LABELS[prompt.availability]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity',
              copied && 'opacity-100 text-[#202020]'
            )}
            onClick={handleCopy}
            title="Copy prompt"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[#5a5a62]"
            onClick={handleTry}
            title="Copy & open in Harness AI"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
        {prompt.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {prompt.description}
      </p>

      {/* SDLC Stage + Complexity */}
      <p className="text-[11px] text-muted-foreground">
        {SDLC_STAGE_LABELS[prompt.sdlcStage]} · {COMPLEXITY_LABELS[prompt.complexity]}
      </p>

      {/* Personas */}
      {shownPersonas.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground shrink-0">For:</span>
          {shownPersonas.map(p => (
            <span
              key={p}
              className="text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded"
            >
              {PERSONA_LABELS[p]}
            </span>
          ))}
          {extraPersonas > 0 && (
            <span className="text-[10px] text-muted-foreground">+{extraPersonas}</span>
          )}
        </div>
      )}

      {/* Footer: agent badge + mode indicator */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
        <span className="text-[11px] text-muted-foreground truncate">
          {AGENT_LABELS[prompt.agentType]}
        </span>
        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5 shrink-0">
          <ModeIcon className="h-3 w-3" />
          {modeConfig.label}
        </span>
      </div>

      {/* MCP requirements */}
      {prompt.mcpRequirements && prompt.mcpRequirements.length > 0 && (
        <div className="flex items-center gap-1 -mt-1">
          <Zap className="h-2.5 w-2.5 text-amber-500 shrink-0" />
          <span className="text-[10px] text-amber-600 font-medium">
            Requires: {prompt.mcpRequirements.join(', ')} MCP
          </span>
        </div>
      )}
    </div>
  )
}
