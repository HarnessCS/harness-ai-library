export type WorkerAgentLinkType = 'custom' | 'system'

export type WorkerAgentRecord = {
  id: string
  name: string
  summary: string
  description: string
  keywords: string[]
  linkType: WorkerAgentLinkType
  harnessAgentId: string
  ownership: string
  lifecycle: string[]
  modules: string[]
  pipelineName: string
  pipelineYaml: string
  agentYaml: string
}

export type HarnessScope = {
  accountId: string
  orgId: string
  projectId: string
}

const SCOPE_KEY = 'harness-ai-library-scope'

export const emptyScope: HarnessScope = { accountId: '', orgId: '', projectId: '' }

export function loadScope(): HarnessScope {
  if (typeof window === 'undefined') return emptyScope
  try {
    const raw = localStorage.getItem(SCOPE_KEY)
    if (!raw) return emptyScope
    const parsed = JSON.parse(raw) as Partial<HarnessScope>
    return {
      accountId: parsed.accountId ?? '',
      orgId: parsed.orgId ?? '',
      projectId: parsed.projectId ?? '',
    }
  } catch {
    return emptyScope
  }
}

export function saveScope(scope: HarnessScope) {
  localStorage.setItem(SCOPE_KEY, JSON.stringify(scope))
}

export function scopeComplete(scope: HarnessScope) {
  return Boolean(scope.accountId.trim() && scope.orgId.trim() && scope.projectId.trim())
}

export function applyYamlScope(yaml: string, scope: HarnessScope) {
  let out = yaml
  const pairs: Array<[string, string]> = [
    ['{{accountId}}', scope.accountId.trim()],
    ['{{orgId}}', scope.orgId.trim()],
    ['{{projectId}}', scope.projectId.trim()],
  ]
  for (const [token, value] of pairs) {
    if (value) out = out.replaceAll(token, value)
  }
  return out
}

export function harnessActionLabel(agent: WorkerAgentRecord) {
  return agent.linkType === 'custom' ? 'Create on Harness' : 'Open in Harness'
}

export function agentConsoleUrl(agent: WorkerAgentRecord, scope: HarnessScope) {
  if (!scopeComplete(scope)) return null
  const accountId = encodeURIComponent(scope.accountId.trim())
  const orgId = encodeURIComponent(scope.orgId.trim())
  const projectId = encodeURIComponent(scope.projectId.trim())
  const base = `https://app.harness.io/ng/account/${accountId}/module/ai-agents/orgs/${orgId}/projects/${projectId}/worker-agents`
  if (agent.linkType === 'custom') return `${base}?action=create`
  const agentId = encodeURIComponent(agent.harnessAgentId)
  return `${base}/${agentId}?type=system`
}

export function filterWorkerAgents(
  agents: WorkerAgentRecord[],
  query: string,
  ownership: string[] = [],
  lifecycle: string[] = [],
) {
  let result = agents
  if (ownership.length > 0) result = result.filter(agent => ownership.includes(agent.ownership))
  if (lifecycle.length > 0) result = result.filter(agent => agent.lifecycle.some(stage => lifecycle.includes(stage)))
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return result
  return result.filter(agent => {
    const haystack = [
      agent.name,
      agent.summary,
      agent.description,
      agent.pipelineName,
      agent.ownership,
      agent.id,
      ...agent.lifecycle,
      ...agent.modules,
      ...agent.keywords,
    ].join(' ').toLowerCase()
    return tokens.every(token => haystack.includes(token))
  })
}
