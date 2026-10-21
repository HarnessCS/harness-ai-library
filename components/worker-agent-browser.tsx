'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  WorkerAgentRecord,
  HarnessScope,
  emptyScope,
  loadScope,
  saveScope,
  scopeComplete,
  applyYamlScope,
  agentConsoleUrl,
  filterWorkerAgents,
} from '@/lib/worker-agents'

function WorkerAgentCard({
  agent,
  scope,
  onOpen,
}: {
  agent: WorkerAgentRecord
  scope: HarnessScope
  onOpen: (agent: WorkerAgentRecord) => void
}) {
  const [preview, setPreview] = useState<'agent' | 'pipeline'>('agent')
  const [copied, setCopied] = useState(false)
  const yaml = applyYamlScope(preview === 'agent' ? agent.agentYaml : agent.pipelineYaml, scope)

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
    <article className="bg-white border border-[#e6e8ee] rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#5a5a62]">
            Worker agent result
          </div>
          <h2 className="text-lg font-semibold mt-1 text-[#202020]">{agent.name}</h2>
        </div>
        <Button size="sm" variant="outline" className="rounded-[10px] border-[#d9dae5] bg-white shrink-0" onClick={() => onOpen(agent)}>
          Open in Harness
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{agent.summary}</p>
      <div className="mt-3 flex bg-[#f4f4f5] rounded-[10px] p-0.5 w-fit" role="tablist" aria-label={`${agent.name} YAML`}>
        {([
          ['agent', 'Agent'],
          ['pipeline', 'Pipeline'],
        ] as const).map(([id, label]) => {
          const selected = preview === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setPreview(id)
                setCopied(false)
              }}
              className={cn(
                'px-3 py-1 rounded-[8px] text-[13px] font-medium text-[#5a5a62]',
                selected && 'bg-white text-[#202020] font-semibold shadow-sm',
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
      <div className="relative mt-3">
        <button
          type="button"
          onClick={copyYaml}
          aria-label="Copy to clipboard"
          title="Copy to clipboard"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-[#d6deeb] hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <pre className="max-h-40 overflow-auto rounded-lg bg-[#0f1419] text-[#d6deeb] p-3 pr-10 text-xs leading-relaxed">
          {yaml}
        </pre>
      </div>
    </article>
  )
}

export function WorkerAgentBrowser() {
  const [agents, setAgents] = useState<WorkerAgentRecord[] | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<HarnessScope>(emptyScope)
  const [pending, setPending] = useState<WorkerAgentRecord | null>(null)
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
    () => (agents ? filterWorkerAgents(agents, query) : []),
    [agents, query],
  )

  function openAgent(agent: WorkerAgentRecord) {
    const url = agentConsoleUrl(agent, scope)
    if (!url) {
      setDraft(scope)
      setPending(agent)
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function confirmScope() {
    if (!pending) return
    saveScope(draft)
    setScope(draft)
    const url = agentConsoleUrl(pending, draft)
    setPending(null)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="max-w-[880px] mx-auto px-4 md:px-6 py-8">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search worker agents"
          className="h-12 rounded-[10px] border-[#d9dae5] bg-white text-sm shadow-sm"
          aria-label="Search worker agents"
        />

        {agents === null ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading worker agents…</p>
        ) : results.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No worker agents match “{query}”.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {results.map(agent => (
              <WorkerAgentCard
                key={agent.id}
                agent={agent}
                scope={scope}
                onOpen={openAgent}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Harness project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            These stay in this browser. They fill org and project in copied YAML and build the Open in Harness link.
          </p>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="account-id">Account ID</Label>
              <Input
                id="account-id"
                value={draft.accountId}
                onChange={e => setDraft(d => ({ ...d, accountId: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="org-id">Org ID</Label>
              <Input
                id="org-id"
                value={draft.orgId}
                onChange={e => setDraft(d => ({ ...d, orgId: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="project-id">Project ID</Label>
              <Input
                id="project-id"
                value={draft.projectId}
                onChange={e => setDraft(d => ({ ...d, projectId: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="rounded-[10px] bg-[#111111] hover:bg-black text-white"
              disabled={!scopeComplete(draft)}
              onClick={confirmScope}
            >
              Open in Harness
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
