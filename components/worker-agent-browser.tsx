'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Search, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { SDLC_STAGE_LABELS, type SdlcStage } from '@/lib/types'
import {
  WorkerAgentRecord,
  HarnessScope,
  emptyScope,
  loadScope,
  saveScope,
  clearScope,
  scopeComplete,
  applyYamlScope,
  agentConsoleUrl,
  harnessActionLabel,
  filterWorkerAgents,
} from '@/lib/worker-agents'

const LIFECYCLE: SdlcStage[] = ['plan', 'build', 'test', 'secure', 'release', 'monitor', 'cost', 'govern']

const OWNERSHIP_LABELS: Record<string, string> = {
  harness_managed: 'Harness managed',
  harness_verified: 'Harness verified',
  custom: 'Custom',
}

function ownershipLabel(ownership: string) {
  return OWNERSHIP_LABELS[ownership] ?? ownership
}

export function WorkerAgentBrowser() {
  const [agents, setAgents] = useState<WorkerAgentRecord[] | null>(null)
  const [query, setQuery] = useState('')
  const [ownership, setOwnership] = useState<string[]>([])
  const [lifecycle, setLifecycle] = useState<SdlcStage | null>(null)
  const [selected, setSelected] = useState<WorkerAgentRecord | null>(null)
  const [scope, setScope] = useState<HarnessScope>(emptyScope)
  const [needsScope, setNeedsScope] = useState(false)
  const [scopeMode, setScopeMode] = useState<'link' | 'edit'>('link')
  const [draft, setDraft] = useState<HarnessScope>(emptyScope)

  useEffect(() => {
    let cancelled = false
    import('@/data/worker-agents.json').then(mod => {
      if (!cancelled) setAgents(mod.default as WorkerAgentRecord[])
    })
    setScope(loadScope())
    return () => {
      cancelled = true
    }
  }, [])

  const results = useMemo(
    () => (agents ? filterWorkerAgents(agents, query, ownership, lifecycle ? [lifecycle] : []) : []),
    [agents, query, ownership, lifecycle],
  )

  const ownershipOptions = useMemo(() => {
    const counts: Record<string, number> = {}
    agents?.forEach(agent => { counts[agent.ownership] = (counts[agent.ownership] ?? 0) + 1 })
    return Object.entries(counts)
  }, [agents])

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    agents?.forEach(agent => agent.lifecycle.forEach(stage => { counts[stage] = (counts[stage] ?? 0) + 1 }))
    return counts
  }, [agents])

  const activeFilterCount = ownership.length + (lifecycle ? 1 : 0)
  const hasActiveFilters = !!query || activeFilterCount > 0

  function clearFilters() {
    setQuery('')
    setOwnership([])
    setLifecycle(null)
  }

  function toggleOwnership(id: string) {
    setOwnership(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  function openInHarness(agent: WorkerAgentRecord) {
    const url = agentConsoleUrl(agent, scope)
    if (!url) {
      setDraft(scope)
      setScopeMode('link')
      setNeedsScope(true)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function editScope() {
    setDraft(scope)
    setScopeMode('edit')
    setNeedsScope(true)
  }

  function unsetScope() {
    clearScope()
    setScope(emptyScope)
    setDraft(emptyScope)
    setNeedsScope(false)
  }

  function confirmScope() {
    saveScope(draft)
    setScope(draft)
    setNeedsScope(false)
    if (scopeMode !== 'link' || !selected) return
    const url = agentConsoleUrl(selected, draft)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border/60 bg-[var(--sidebar)]">
        <div className="px-3 py-2.5 border-b border-white/10 shrink-0 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--sidebar-foreground)]">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-[var(--harness-blue)] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-[10px] text-[var(--sidebar-foreground)]/50 hover:text-[var(--sidebar-foreground)]">
              Clear all
            </button>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="py-2">
            <div className="px-3 pb-1">
              <button
                onClick={clearFilters}
                className={cn(
                  'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors',
                  !hasActiveFilters
                    ? 'bg-[var(--harness-blue)] text-white font-medium'
                    : 'text-[var(--sidebar-foreground)]/70 hover:bg-white/10 hover:text-[var(--sidebar-foreground)]',
                )}
              >
                <span>All agents</span>
                <span className="text-[10px] opacity-70 font-mono">{agents?.length ?? 0}</span>
              </button>
            </div>
            <FilterGroup title="Source">
              {ownershipOptions.map(([id, count]) => (
                <FilterRow
                  key={id}
                  label={ownershipLabel(id)}
                  count={count}
                  selected={ownership.includes(id)}
                  onToggle={() => toggleOwnership(id)}
                />
              ))}
            </FilterGroup>
            <FilterGroup title="Stage">
              {LIFECYCLE.map(stage => (
                <FilterRow
                  key={stage}
                  label={SDLC_STAGE_LABELS[stage]}
                  count={stageCounts[stage] ?? 0}
                  selected={lifecycle === stage}
                  onToggle={() => setLifecycle(lifecycle === stage ? null : stage)}
                />
              ))}
            </FilterGroup>
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b border-border/60 px-4 md:px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search worker agents, pipelines, stages… (⌘K)"
              className="pl-9 pr-8 h-9 text-sm bg-muted/40 border-border/60"
              aria-label="Search worker agents"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {scopeComplete(scope) && (
            <div className="flex items-center gap-2 min-w-0 text-xs text-[#5a5a62]">
              <span className="truncate" title={`${scope.accountId} / ${scope.orgId} / ${scope.projectId}`}>
                {scope.accountId} / {scope.orgId} / {scope.projectId}
              </span>
              <button type="button" onClick={editScope} className="shrink-0 font-medium text-[#202020] hover:underline">
                Change
              </button>
              <button type="button" onClick={unsetScope} className="shrink-0 font-medium text-[#202020] hover:underline">
                Clear
              </button>
            </div>
          )}
          </div>
          {hasActiveFilters && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {results.length} result{results.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="border-b border-border/60 bg-background px-4 md:px-6 overflow-x-auto shrink-0">
          <div className="flex items-center gap-0.5 py-2 min-w-max">
            <button
              onClick={() => setLifecycle(null)}
              className={cn(
                'shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-all whitespace-nowrap',
                !lifecycle ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              All <span className="opacity-60">{agents?.length ?? 0}</span>
            </button>
            {LIFECYCLE.map(stage => (
              <button
                key={stage}
                onClick={() => setLifecycle(lifecycle === stage ? null : stage)}
                className={cn(
                  'shrink-0 text-xs font-medium px-3 py-1 rounded-full transition-all whitespace-nowrap',
                  lifecycle === stage ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {SDLC_STAGE_LABELS[stage]} <span className="opacity-60">{stageCounts[stage] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-4 md:px-6 py-5">
            {agents === null ? (
              <p className="text-sm text-muted-foreground">Loading worker agents…</p>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Search className="h-6 w-6 text-muted-foreground/60" />
                <p className="font-semibold text-sm">No worker agents match</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>Clear search and filters</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {results.map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelected(agent)}
                    className="text-left flex flex-col gap-2.5 rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-[var(--harness-blue)]/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#5a5a62]">
                      {ownershipLabel(agent.ownership)}
                    </span>
                    <span className="flex items-start gap-2">
                      {agent.ownership === 'harness_managed' && (
                        <img src="/harness-mark.png" alt="" className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span className="font-semibold text-sm text-foreground leading-snug line-clamp-2">{agent.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{agent.summary}</span>
                    <span className="text-[11px] text-muted-foreground mt-auto">{agent.pipelineName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <AgentDetail
        agent={selected}
        scope={scope}
        onClose={() => { setSelected(null); setNeedsScope(false) }}
        onOpen={openInHarness}
      />

      <Dialog open={needsScope} onOpenChange={setNeedsScope}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Harness project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            These stay in this browser. They fill org and project in copied YAML and build the Harness link.
          </p>
          <ScopeFields draft={draft} onChange={setDraft} />
          <div className="flex items-center justify-between gap-3">
            {scopeMode === 'edit' ? (
              <Button type="button" variant="outline" className="rounded-[10px]" onClick={unsetScope}>
                Clear
              </Button>
            ) : <span />}
            <Button className="rounded-[10px] bg-[#111111] hover:bg-black text-white" disabled={!scopeComplete(draft)} onClick={confirmScope}>
              {scopeMode === 'edit' ? 'Save' : selected ? harnessActionLabel(selected) : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AgentDetail({
  agent,
  scope,
  onClose,
  onOpen,
}: {
  agent: WorkerAgentRecord | null
  scope: HarnessScope
  onClose: () => void
  onOpen: (agent: WorkerAgentRecord) => void
}) {
  const [preview, setPreview] = useState<'agent' | 'pipeline'>('agent')
  const [copied, setCopied] = useState(false)
  const yaml = agent ? applyYamlScope(preview === 'agent' ? agent.agentYaml : agent.pipelineYaml, scope) : ''

  useEffect(() => {
    setPreview('agent')
    setCopied(false)
  }, [agent?.id])

  async function copyYaml() {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      toast.success('Copied to clipboard')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to the clipboard')
    }
  }

  return (
    <Dialog open={agent !== null} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="flex max-h-[min(85vh,720px)] w-full flex-col gap-4 overflow-hidden [grid-template-columns:minmax(0,1fr)] sm:max-w-3xl">
        {agent && (
          <>
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                {agent.ownership === 'harness_managed' && (
                  <img src="/harness-mark.png" alt="" className="h-5 w-5 shrink-0" />
                )}
                {agent.name}
              </DialogTitle>
            </DialogHeader>
            <p className="shrink-0 text-sm text-muted-foreground">{agent.summary}</p>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="flex bg-[#f4f4f5] rounded-[10px] p-0.5" role="tablist" aria-label="YAML preview">
                {([
                  ['agent', 'Agent'],
                  ['pipeline', 'Pipeline'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={preview === id}
                    onClick={() => { setPreview(id); setCopied(false) }}
                    className={cn(
                      'px-3 py-1 rounded-[8px] text-[13px] font-medium text-[#5a5a62]',
                      preview === id && 'bg-white text-[#202020] font-semibold shadow-sm',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" className="rounded-[10px] border-[#d9dae5] bg-white" onClick={() => onOpen(agent)}>
                {harnessActionLabel(agent)}
              </Button>
            </div>
            <div className="relative min-h-0 min-w-0">
              <button
                type="button"
                onClick={copyYaml}
                aria-label="Copy to clipboard"
                title="Copy to clipboard"
                className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#d6deeb] hover:bg-white/10 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <pre className="max-h-[min(24rem,50vh)] w-full min-w-0 overflow-auto whitespace-pre rounded-lg bg-[#0f1419] p-3 pr-10 text-xs leading-relaxed text-[#d6deeb]">
                {yaml}
              </pre>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ScopeFields({ draft, onChange }: { draft: HarnessScope; onChange: (next: HarnessScope) => void }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="account-id">Account ID</Label>
        <Input id="account-id" value={draft.accountId} onChange={e => onChange({ ...draft, accountId: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="org-id">Org ID</Label>
        <Input id="org-id" value={draft.orgId} onChange={e => onChange({ ...draft, orgId: e.target.value })} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="project-id">Project ID</Label>
        <Input id="project-id" value={draft.projectId} onChange={e => onChange({ ...draft, projectId: e.target.value })} />
      </div>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2">
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--sidebar-foreground)]/50">{title}</div>
      {children}
    </div>
  )
}

function FilterRow({ label, count, selected, onToggle }: { label: string; count: number; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between px-3 py-1.5 text-xs',
        selected ? 'text-[var(--sidebar-foreground)] font-medium' : 'text-[var(--sidebar-foreground)]/60 hover:text-[var(--sidebar-foreground)]',
      )}
    >
      <span className="truncate">{label}</span>
      <span className="text-[10px] opacity-50 font-mono shrink-0 ml-1">{count}</span>
    </button>
  )
}
